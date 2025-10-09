import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { message, patientId, clinicId } = await req.json();

    // Get active AI config for clinic context
    const { data: config } = await supabase
      .from('ai_config_profiles')
      .select('*')
      .eq('context', 'clinic_triage')
      .eq('is_active', true)
      .single();

    // Get approved medical sources
    const { data: sources } = await supabase
      .from('ai_source_registry')
      .select('*')
      .eq('status', 'approved');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a medical triage assistant for clinic staff. 
Context: ${config?.responsiveness?.tone || 'professional'}
Compliance: ${JSON.stringify(config?.compliance_layers || {})}

Your role:
1. Analyze patient messages/symptoms
2. Assign urgency level (routine, urgent, emergency)
3. Suggest appropriate specialist type
4. Flag potential red flags
5. Recommend next steps

Approved medical sources: ${sources?.map(s => s.name).join(', ')}

IMPORTANT: 
- Always err on the side of caution
- Clearly state when immediate medical attention is needed
- Cite sources when making recommendations
- Never diagnose - only triage and recommend`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Patient message: ${message}\n\nProvide triage assessment.` }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assessment = aiData.choices[0].message.content;

    // Extract urgency and specialist from response
    const urgencyMatch = assessment.match(/urgency.*?:\s*(routine|urgent|emergency)/i);
    const specialistMatch = assessment.match(/specialist.*?:\s*([^\n\.]+)/i);

    const result = {
      assessment,
      urgency: urgencyMatch?.[1]?.toLowerCase() || 'routine',
      suggestedSpecialist: specialistMatch?.[1] || null,
      timestamp: new Date().toISOString(),
    };

    // Log triage interaction
    await supabase.from('ai_symptom_logs').insert({
      context: 'clinic_triage',
      inputs_hash: message.substring(0, 100),
      output_summary: assessment.substring(0, 200),
      citations: [],
      retrieved_sources: sources?.map(s => s.source_key) || [],
      flags: { urgency: result.urgency },
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Triage error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
