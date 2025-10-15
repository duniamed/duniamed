// UNLIMITED EDGE FUNCTION CAPACITIES: Emergency Triage Optimizer
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
    const { patientId, symptoms, vitalSigns, medicalHistory } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Emergency triage optimization:', { patientId, symptoms });

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
            content: 'Perform emergency triage using ESI (Emergency Severity Index). Return JSON: { "triageLevel": 1-5, "acuity": "", "estimatedWaitTime": 0, "immediateInterventions": [], "requiredResources": [], "specialtyConsult": "", "redFlags": [], "safetyPrecautions": [], "dispositionRecommendation": "", "reassessmentInterval": 0 }'
          },
          {
            role: 'user',
            content: JSON.stringify({ patientId, symptoms, vitalSigns, medicalHistory })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const triage = JSON.parse(aiData.choices[0].message.content);

    await supabase
      .from('emergency_triage_logs')
      .insert({
        patient_id: patientId,
        triage_level: triage.triageLevel,
        acuity: triage.acuity,
        symptoms: symptoms,
        vital_signs: vitalSigns,
        red_flags: triage.redFlags,
        immediate_interventions: triage.immediateInterventions
      });

    return new Response(JSON.stringify({ success: true, triage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Emergency triage error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
