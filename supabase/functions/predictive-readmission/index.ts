// UNLIMITED EDGE FUNCTION CAPACITIES: Predictive Readmission Analysis
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
    const { patientId, dischargeDate } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Analyzing readmission risk for patient ${patientId}`);

    const { data: history } = await supabase
      .from('appointments')
      .select('*, prescriptions(*), diagnoses(*)')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false })
      .limit(10);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'Predict 30-day readmission risk. Return JSON: { "risk_score": 0-100, "risk_factors": [], "recommendations": [], "follow_up_schedule": "" }' },
          { role: 'user', content: JSON.stringify({ history, dischargeDate }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const prediction = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('readmission_predictions').insert({
      patient_id: patientId,
      discharge_date: dischargeDate,
      risk_score: prediction.risk_score,
      risk_factors: prediction.risk_factors,
      recommendations: prediction.recommendations
    });

    if (prediction.risk_score > 60) {
      await supabase.from('notifications').insert({
        user_id: patientId,
        type: 'readmission_risk',
        title: 'High Readmission Risk Detected',
        message: `Your readmission risk is ${prediction.risk_score}%. Please follow up as recommended.`,
        metadata: { prediction }
      });
    }

    return new Response(JSON.stringify({ success: true, prediction }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Predictive readmission error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
