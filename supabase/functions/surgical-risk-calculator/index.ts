// UNLIMITED EDGE FUNCTION CAPACITIES: Surgical Risk Calculator
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
    const { patient_id, procedure_type, patient_data } = await req.json();

    console.log(`Calculating surgical risk for ${procedure_type}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch patient medical history and lab results
    const { data: medicalHistory } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patient_id);

    const { data: labResults } = await supabase
      .from('lab_results')
      .select('*')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false })
      .limit(10);

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
            content: `Calculate surgical risk using ASA, RCRI, and NSQIP models. Return JSON with:
- overall_risk_score: 0-100
- mortality_risk: Percentage
- morbidity_risk: Percentage
- asa_classification: I-VI
- rcri_score: Revised Cardiac Risk Index
- risk_factors: Array of identified risk factors
- complication_risks: Specific complication probabilities
- anesthesia_considerations: Anesthesia-related considerations
- optimization_recommendations: Pre-operative optimization suggestions
- alternative_procedures: Less risky alternative options
- perioperative_plan: Recommended perioperative management
- icu_probability: Likelihood of ICU admission
- estimated_los: Estimated length of stay (days)`
          },
          {
            role: 'user',
            content: JSON.stringify({ 
              procedure_type,
              patient_data,
              medical_history: medicalHistory,
              lab_results: labResults
            })
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const riskAssessment = JSON.parse(aiData.choices[0].message.content);

    // Store risk assessment
    await supabase.from('surgical_risk_assessments').insert({
      patient_id,
      procedure_type,
      risk_assessment: riskAssessment,
      overall_risk_score: riskAssessment.overall_risk_score,
      assessed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, risk_assessment: riskAssessment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Surgical risk calculation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});