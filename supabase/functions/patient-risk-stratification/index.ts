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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { patientId } = await req.json();

    // Fetch comprehensive patient data
    const { data: patient } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single();

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false })
      .limit(50);

    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId);

    const { data: vitals } = await supabase
      .from('rpm_device_readings')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .limit(100);

    // AI-based risk stratification
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
            content: `Perform comprehensive patient risk stratification. Return JSON:
{
  "risk_level": "low|medium|high|critical",
  "risk_score": 0-100,
  "risk_factors": [
    {
      "factor": "string",
      "severity": "low|medium|high",
      "evidence": "string"
    }
  ],
  "readmission_risk": 0-1,
  "hospitalization_risk": 0-1,
  "care_recommendations": ["string"],
  "priority_interventions": ["string"],
  "monitoring_frequency": "daily|weekly|monthly",
  "escalation_triggers": ["string"]
}`
          },
          {
            role: 'user',
            content: JSON.stringify({
              patient,
              appointments,
              prescriptions,
              vitals
            })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const stratification = JSON.parse(aiData.choices[0].message.content);

    // Store risk assessment
    await supabase.from('patient_risk_assessments').insert({
      patient_id: patientId,
      risk_level: stratification.risk_level,
      risk_score: stratification.risk_score,
      risk_factors: stratification.risk_factors,
      assessment_data: stratification,
      assessed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      stratification
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Patient risk stratification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
