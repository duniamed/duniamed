// UNLIMITED EDGE FUNCTION CAPACITIES: Patient Churn Prediction
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
    const { clinicId } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Predicting patient churn for clinic ${clinicId}`);

    const { data: patients } = await supabase
      .from('profiles')
      .select('id, created_at, appointments(count), prescriptions(count), last_appointment:appointments(scheduled_at)')
      .eq('role', 'patient');

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'Predict patient churn risk. Return JSON: { "at_risk_patients": [{"patient_id": "", "churn_probability": 0-1, "risk_factors": [], "recommended_actions": []}], "overall_churn_rate": number, "trends": [] }' },
          { role: 'user', content: JSON.stringify(patients) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const churnAnalysis = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, churnAnalysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Churn prediction error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
