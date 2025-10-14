// UNLIMITED EDGE FUNCTION CAPACITIES: Mental Health Crisis Detection
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
    const { patientId, screeningData, assessmentType } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Analyzing mental health screening for patient ${patientId}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'Analyze mental health screening (PHQ-9, GAD-7) and detect crisis risk. Return JSON: { "crisis_level": "none|low|moderate|high|critical", "phq9_score": 0-27, "gad7_score": 0-21, "immediate_action_required": boolean, "recommended_interventions": [], "specialist_referral_needed": boolean }' },
          { role: 'user', content: JSON.stringify({ assessmentType, screeningData }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const crisisAnalysis = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('mental_health_screenings').insert({
      patient_id: patientId,
      assessment_type: assessmentType,
      screening_data: screeningData,
      crisis_analysis: crisisAnalysis,
      crisis_level: crisisAnalysis.crisis_level,
      screened_at: new Date().toISOString()
    });

    if (crisisAnalysis.immediate_action_required) {
      await supabase.from('notifications').insert({
        user_id: patientId,
        type: 'mental_health_alert',
        title: 'Mental Health Crisis Detected',
        message: 'Immediate intervention recommended. Please contact crisis support.',
        priority: 'critical'
      });
    }

    return new Response(JSON.stringify({ success: true, crisisAnalysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Mental health crisis detection error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
