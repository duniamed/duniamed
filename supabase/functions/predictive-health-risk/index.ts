// UNLIMITED EDGE FUNCTION CAPACITIES: Predictive Health Risk Scoring
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
    const { patientId, riskFactors, medicalHistory, vitalSigns, lifestyle } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: labResults } = await supabase
      .from('lab_results')
      .select('*')
      .eq('patient_id', patientId)
      .order('result_date', { ascending: false })
      .limit(10);

    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active');

    console.log('Calculating health risk scores:', { patientId });

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
            content: 'Predict health risks using ML-based risk stratification. Return JSON: { "overallRiskScore": 0-100, "riskCategory": "low|moderate|high|critical", "specificRisks": [{"condition": "", "probability": 0-1, "timeframe": "", "preventativeActions": []}], "cardiovascularRisk": 0-100, "diabetesRisk": 0-100, "cancerRisk": 0-100, "fallRisk": 0-100, "readmissionRisk": 0-100, "interventionRecommendations": [], "preventativeCare": [], "riskTrends": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ patientId, riskFactors, medicalHistory, vitalSigns, lifestyle, labResults, prescriptions })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const riskProfile = JSON.parse(aiData.choices[0].message.content);

    await supabase
      .from('health_risk_scores')
      .upsert({
        patient_id: patientId,
        overall_score: riskProfile.overallRiskScore,
        risk_category: riskProfile.riskCategory,
        cardiovascular_risk: riskProfile.cardiovascularRisk,
        diabetes_risk: riskProfile.diabetesRisk,
        specific_risks: riskProfile.specificRisks,
        interventions: riskProfile.interventionRecommendations,
        calculated_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ success: true, riskProfile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Predictive health risk error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
