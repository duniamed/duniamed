// UNLIMITED EDGE FUNCTION CAPACITIES: Chronic Disease Management
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
    const { patientId, conditionType, vitalSigns, medications } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: patient } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single();

    const { data: history } = await supabase
      .from('vitals_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .limit(30);

    console.log('Managing chronic disease:', { patientId, conditionType });

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
            content: 'Provide chronic disease management guidance for diabetes, hypertension, COPD, heart failure. Return JSON: { "diseaseControl": 0-100, "trendAnalysis": "", "medicationAdherence": 0-100, "lifestyleFactors": [], "alerts": [], "actionPlan": [], "goalProgress": {}, "nextSteps": [], "educationalTopics": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ patientId, patient, conditionType, vitalSigns, medications, history })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const management = JSON.parse(aiData.choices[0].message.content);

    await supabase
      .from('chronic_disease_tracking')
      .insert({
        patient_id: patientId,
        condition_type: conditionType,
        disease_control_score: management.diseaseControl,
        medication_adherence: management.medicationAdherence,
        alerts: management.alerts,
        action_plan: management.actionPlan
      });

    return new Response(JSON.stringify({ success: true, management }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Chronic disease management error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
