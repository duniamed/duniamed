// UNLIMITED EDGE FUNCTION CAPACITIES: AI Documentation Assistant
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { consultation_transcript, visit_type } = await req.json();

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
            content: `Generate comprehensive clinical documentation from consultation. Return JSON with:
- soap_note: Complete SOAP note (Subjective, Objective, Assessment, Plan)
- icd10_codes: Relevant diagnosis codes
- cpt_codes: Procedure codes for billing
- medication_list: Prescribed medications with dosages
- follow_up_plan: Next steps and timeline
- patient_instructions: Clear instructions for patient
- clinical_impression: Summary for provider
- billing_summary: Charges and procedures`
          },
          {
            role: 'user',
            content: consultation_transcript
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const documentation = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, documentation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Documentation assistant error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
