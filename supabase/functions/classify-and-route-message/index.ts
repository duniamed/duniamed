import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { messageId, content, metadata } = await req.json();

    // AI-powered classification using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const classificationPrompt = `Classify this patient message for clinical routing:

Message: "${content}"

Analyze and respond with a JSON object containing:
- urgency: "urgent" (needs immediate attention), "high" (within 1 hour), "routine" (same business day), or "low" (can wait 24-48 hours)
- topic: one of ["prescription_refill", "test_results", "appointment_scheduling", "billing", "clinical_question", "medication_side_effect", "symptom_concern", "administrative"]
- requiresMDReview: boolean (true if physician must see it, false if nurse/admin can handle)
- suggestedResponse: brief suggestion for handling
- redFlags: array of concerning symptoms or keywords found

Consider these red flags requiring urgent attention:
- Chest pain, difficulty breathing, severe bleeding
- Suicidal thoughts or self-harm
- Severe allergic reactions
- High fever with confusion
- Severe pain (8-10/10)`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a clinical triage assistant. Always respond with valid JSON only.' },
          { role: 'user', content: classificationPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'classify_message',
            description: 'Classify a patient message',
            parameters: {
              type: 'object',
              properties: {
                urgency: { type: 'string', enum: ['urgent', 'high', 'routine', 'low'] },
                topic: { type: 'string' },
                requiresMDReview: { type: 'boolean' },
                suggestedResponse: { type: 'string' },
                redFlags: { type: 'array', items: { type: 'string' } }
              },
              required: ['urgency', 'topic', 'requiresMDReview']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'classify_message' } }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI classification failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    const classification = toolCall ? JSON.parse(toolCall.function.arguments) : {
      urgency: 'routine',
      topic: 'clinical_question',
      requiresMDReview: true
    };

    // Get clinic's routing rules
    const { data: clinic } = await supabase
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .single();

    const clinicId = clinic?.clinic_id || metadata?.clinicId;

    if (!clinicId) {
      throw new Error('No clinic association found');
    }

    const { data: rules } = await supabase
      .from('message_routing_rules')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    // Check quiet hours
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    let routeTo = 'clinical';
    let batchUntil = null;
    let autoRespondMacroId = null;

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        const conditions = rule.conditions as any;
        
        // Check if rule matches
        let matches = true;
        
        if (conditions.urgency_level && classification.urgency !== conditions.urgency_level) {
          matches = false;
        }
        
        if (conditions.keywords && Array.isArray(conditions.keywords)) {
          const hasKeyword = conditions.keywords.some((kw: string) => 
            content.toLowerCase().includes(kw.toLowerCase())
          );
          if (!hasKeyword) matches = false;
        }

        if (matches) {
          routeTo = rule.route_to_pool || 'clinical';
          
          // Check quiet hours
          if (rule.enforce_quiet_hours) {
            const quietStart = rule.quiet_hours_start;
            const quietEnd = rule.quiet_hours_end;
            
            const isQuietHours = (quietStart > quietEnd)
              ? (currentTime >= quietStart || currentTime < quietEnd)
              : (currentTime >= quietStart && currentTime < quietEnd);

            if (isQuietHours && classification.urgency !== 'urgent') {
              // Batch until next business day
              const nextBusinessDay = new Date(now);
              nextBusinessDay.setDate(now.getDate() + 1);
              nextBusinessDay.setHours(8, 0, 0, 0);
              batchUntil = nextBusinessDay.toISOString();
            }
          }

          autoRespondMacroId = rule.auto_respond_macro_id;
          break;
        }
      }
    }

    // Route to appropriate queue or batch
    const { data: queue } = await supabase
      .from('work_queues')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('queue_type', routeTo)
      .eq('is_active', true)
      .single();

    if (batchUntil && classification.urgency !== 'urgent') {
      // Add to batch for deferred processing
      const { data: batch } = await supabase
        .from('message_batches')
        .insert({
          clinic_id: clinicId,
          batch_type: classification.urgency === 'low' ? 'routine' : 'follow_up',
          scheduled_process_at: batchUntil,
          message_ids: [messageId],
          assigned_to_pool: routeTo
        })
        .select()
        .single();

      // Send auto-response if configured
      if (autoRespondMacroId) {
        const { data: macro } = await supabase
          .from('response_macros')
          .select('body_template')
          .eq('id', autoRespondMacroId)
          .single();

        if (macro) {
          // TODO: Send auto-response using the macro template
          console.log('Auto-response:', macro.body_template);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          classification,
          routing: {
            batched: true,
            batchId: batch.id,
            processAt: batchUntil,
            pool: routeTo
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Add to immediate work queue
      if (queue) {
        await supabase
          .from('work_queue_items')
          .insert({
            queue_id: queue.id,
            item_type: 'message',
            item_id: messageId,
            urgency: classification.urgency,
            topic: classification.topic,
            requires_md_review: classification.requiresMDReview
          });
      }

      return new Response(
        JSON.stringify({
          success: true,
          classification,
          routing: {
            batched: false,
            queue: routeTo,
            requiresMDReview: classification.requiresMDReview
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});