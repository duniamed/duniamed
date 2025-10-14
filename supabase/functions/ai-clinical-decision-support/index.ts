// UNLIMITED EDGE FUNCTION CAPACITIES: AI Clinical Decision Support System
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
    const { patient_data, clinical_context, query } = await req.json();

    console.log(`Providing clinical decision support for: ${query}`);

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
            content: `You are a clinical decision support system. Provide evidence-based recommendations.
Return JSON with:
- recommendations: Array of clinical recommendations with evidence levels
- differential_diagnosis: Possible diagnoses ranked by likelihood
- diagnostic_tests: Recommended tests and procedures
- treatment_options: Treatment options with pros/cons
- risk_factors: Identified risk factors
- references: Medical literature references`
          },
          {
            role: 'user',
            content: `Patient: ${JSON.stringify(patient_data)}\nContext: ${clinical_context}\nQuery: ${query}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const decision_support = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, decision_support }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Clinical decision support error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
