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

    const { clinicId } = await req.json();

    // Fetch patient engagement data
    const { data: patients } = await supabase
      .from('profiles')
      .select(`
        id,
        created_at,
        last_login,
        appointments(id, scheduled_at, status, cancelled_at),
        prescriptions(id, created_at, status),
        messages(id, created_at)
      `)
      .eq('role', 'patient');

    // ML churn prediction
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Predict patient churn risk using ML. Return JSON:
{
  "high_risk_patients": [
    {
      "patient_id": "uuid",
      "churn_probability": 0-1,
      "risk_level": "low|medium|high|critical",
      "days_since_last_visit": number,
      "predicted_churn_date": "ISO date",
      "key_indicators": ["string"],
      "retention_recommendations": ["string"]
    }
  ],
  "churn_statistics": {
    "total_patients_analyzed": number,
    "high_risk_count": number,
    "medium_risk_count": number,
    "low_risk_count": number,
    "predicted_monthly_churn_rate": number
  },
  "engagement_patterns": {
    "avg_days_between_visits": number,
    "appointment_cancellation_rate": number,
    "message_response_rate": number
  },
  "retention_strategies": [
    {
      "strategy": "string",
      "target_segment": "string",
      "expected_impact": number,
      "implementation_priority": "low|medium|high"
    }
  ]
}`
          },
          {
            role: 'user',
            content: JSON.stringify({
              patients,
              clinicId
            })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const churnAnalysis = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({
      success: true,
      churnAnalysis,
      patients_analyzed: patients?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Patient churn prediction error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
