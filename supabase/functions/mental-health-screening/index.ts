// UNLIMITED EDGE FUNCTION CAPACITIES: Mental Health Screening
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
    const { patientId, responses, screeningType } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Mental health screening for patient ${patientId}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Analyze mental health screening. Return JSON: { "risk_level": "low|moderate|high|crisis", "phq9_score": 0-27, "gad7_score": 0-21, "recommendations": [], "requires_immediate_intervention": boolean }' },
          { role: 'user', content: JSON.stringify({ responses, screeningType }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const screening = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('mental_health_screenings').insert({
      patient_id: patientId,
      screening_type: screeningType,
      risk_level: screening.risk_level,
      phq9_score: screening.phq9_score,
      gad7_score: screening.gad7_score,
      recommendations: screening.recommendations,
      screened_at: new Date().toISOString()
    });

    if (screening.requires_immediate_intervention) {
      await supabase.from('notifications').insert({
        user_id: patientId,
        type: 'mental_health_crisis',
        title: 'Immediate Support Available',
        message: 'Please contact crisis support: 988 Suicide & Crisis Lifeline',
        metadata: { screening }
      });
    }

    return new Response(JSON.stringify({ success: true, screening }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Mental health screening error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
