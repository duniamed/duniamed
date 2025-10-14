// UNLIMITED EDGE FUNCTION CAPACITIES: Clinical Trial Enrollment
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
    const { patientId, trialId, patientData } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Enrolling patient ${patientId} in trial ${trialId}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Check clinical trial eligibility criteria. Return JSON: { "eligible": boolean, "eligibility_score": 0-100, "criteria_met": [], "criteria_failed": [], "enrollment_recommendation": "" }' },
          { role: 'user', content: JSON.stringify(patientData) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const eligibilityCheck = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('clinical_trial_enrollments').insert({
      patient_id: patientId,
      trial_id: trialId,
      eligibility_check: eligibilityCheck,
      enrollment_status: eligibilityCheck.eligible ? 'eligible' : 'ineligible',
      enrolled_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, eligibilityCheck }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Clinical trial enrollment error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
