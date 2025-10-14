// UNLIMITED EDGE FUNCTION CAPACITIES: Payment Dispute Handler
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
    const { payment_id, dispute_reason, evidence } = await req.json();

    console.log(`Handling payment dispute: ${payment_id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // AI-powered dispute analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Analyze payment dispute and suggest resolution. Return JSON with:
- dispute_validity: Assessment of dispute validity
- recommended_action: Suggested action (refund, partial refund, deny)
- response_template: Template response for customer
- evidence_strength: Strength of provided evidence
- win_probability: Probability of winning dispute (0-100)`
          },
          {
            role: 'user',
            content: `Reason: ${dispute_reason}\nEvidence: ${JSON.stringify(evidence)}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // Create dispute record
    const dispute = {
      payment_id,
      reason: dispute_reason,
      evidence,
      ai_analysis: analysis,
      status: 'under_review',
      created_at: new Date().toISOString()
    };

    return new Response(JSON.stringify({ success: true, dispute, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Dispute handler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
