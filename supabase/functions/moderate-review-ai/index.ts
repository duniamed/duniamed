import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviewText, rating, specialistId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Moderating review with AI:', { reviewText: reviewText.substring(0, 50), rating });

    // Call Lovable AI for moderation
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
            content: `You are a medical review moderator. Analyze reviews for:
1. Profanity or abusive language
2. Protected Health Information (PHI) that should be redacted
3. False medical claims or misinformation
4. Spam or irrelevant content
5. Threats or harassment

Return a JSON object with:
- "approved": boolean (true if review is safe to publish)
- "flags": array of issues found (empty if none)
- "severity": "low", "medium", or "high"
- "suggested_action": "approve", "flag_for_review", or "reject"
- "phi_detected": boolean
- "redacted_text": the review with PHI replaced with [REDACTED]`
          },
          {
            role: 'user',
            content: `Review text: "${reviewText}"\nRating: ${rating}/5 stars\n\nAnalyze this review and return the moderation result.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "moderate_review",
            description: "Moderate a healthcare review for safety and compliance",
            parameters: {
              type: "object",
              properties: {
                approved: { type: "boolean" },
                flags: {
                  type: "array",
                  items: { type: "string" }
                },
                severity: {
                  type: "string",
                  enum: ["low", "medium", "high"]
                },
                suggested_action: {
                  type: "string",
                  enum: ["approve", "flag_for_review", "reject"]
                },
                phi_detected: { type: "boolean" },
                redacted_text: { type: "string" }
              },
              required: ["approved", "flags", "severity", "suggested_action", "phi_detected", "redacted_text"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "moderate_review" } }
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: 'AI credits exhausted. Please add funds to your workspace.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI moderation response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const moderationResult = JSON.parse(toolCall.function.arguments);

    // Log moderation decision
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('audit_logs').insert({
      action: 'ai_moderation',
      resource_type: 'review',
      changes: {
        specialist_id: specialistId,
        original_text: reviewText,
        moderation_result: moderationResult
      }
    });

    return new Response(
      JSON.stringify(moderationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in moderate-review-ai:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
