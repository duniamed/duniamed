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

    const { review_id, content, author_demographics } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use Lovable AI for moderation with fairness checks
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a content moderation system for healthcare reviews. Analyze the content for:
1. Policy violations (hate speech, profanity, personal attacks, spam, medical misinformation)
2. Bias/fairness concerns across demographics
3. Context appropriateness for healthcare setting

Return structured moderation decision with fairness analysis.`
          },
          {
            role: 'user',
            content: `Review content: "${content}"\n\nAuthor demographics: ${JSON.stringify(author_demographics || {})}\n\nAnalyze for policy violations and potential bias.`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'moderate_content',
              description: 'Return moderation decision with policy violations and fairness analysis',
              parameters: {
                type: 'object',
                properties: {
                  approved: { type: 'boolean' },
                  confidence: { type: 'number', minimum: 0, maximum: 1 },
                  violations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                        explanation: { type: 'string' }
                      }
                    }
                  },
                  fairness_flags: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        concern: { type: 'string' },
                        demographic_group: { type: 'string' },
                        explanation: { type: 'string' }
                      }
                    }
                  },
                  requires_human_review: { type: 'boolean' },
                  explanation: { type: 'string' }
                },
                required: ['approved', 'confidence', 'violations', 'fairness_flags', 'requires_human_review', 'explanation']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'moderate_content' } }
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No moderation decision returned');
    }

    const moderation = JSON.parse(toolCall.function.arguments);

    // Update review with moderation result
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        moderation_status: moderation.approved ? 'approved' : 'flagged',
        moderation_flags: moderation.violations.map((v: any) => v.type),
        moderation_notes: moderation.explanation,
        moderation_metadata: {
          confidence: moderation.confidence,
          fairness_flags: moderation.fairness_flags,
          requires_human_review: moderation.requires_human_review,
          moderated_at: new Date().toISOString(),
        }
      })
      .eq('id', review_id);

    if (updateError) throw updateError;

    // Queue for human review if needed
    if (moderation.requires_human_review) {
      await supabase.from('work_queue_items').insert({
        item_type: 'content_moderation',
        item_id: review_id,
        priority: moderation.violations.some((v: any) => v.severity === 'high') ? 'high' : 'medium',
        metadata: {
          moderation,
          content_preview: content.substring(0, 200),
          fairness_concerns: moderation.fairness_flags.length > 0,
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      approved: moderation.approved,
      requires_review: moderation.requires_human_review,
      violations: moderation.violations,
      fairness_flags: moderation.fairness_flags,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('AI moderation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
