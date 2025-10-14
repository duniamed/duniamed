// UNLIMITED EDGE FUNCTION CAPACITIES: Treatment Outcome Predictor
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
    const { patient_id, proposed_treatment, diagnosis } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: history } = await supabase
      .from('appointments')
      .select('*, prescriptions(*)')
      .eq('patient_id', patient_id);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `Predict treatment outcomes based on patient history. Return JSON with:
- success_probability: 0-1 likelihood of success
- expected_timeline: Days/weeks to improvement
- potential_complications: Risks to monitor
- alternative_treatments: Other options with comparisons
- patient_factors: Demographics affecting outcome
- adherence_prediction: Likely compliance level
- cost_effectiveness: ROI analysis
- evidence_strength: Quality of supporting data`
          },
          {
            role: 'user',
            content: JSON.stringify({ history, proposed_treatment, diagnosis })
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const prediction = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, prediction }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Treatment outcome prediction error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
