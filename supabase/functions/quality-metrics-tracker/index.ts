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

    const { clinicId, period } = await req.json();

    // Calculate comprehensive quality metrics
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', period.start)
      .lte('scheduled_at', period.end);

    const { data: outcomes } = await supabase
      .from('patient_outcomes')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('recorded_at', period.start)
      .lte('recorded_at', period.end);

    const { data: satisfaction } = await supabase
      .from('patient_satisfaction_surveys')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('created_at', period.start)
      .lte('created_at', period.end);

    // AI-powered quality analysis
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
            content: `Analyze healthcare quality metrics. Return JSON:
{
  "overall_score": 0-100,
  "metrics": {
    "patient_satisfaction": 0-100,
    "clinical_outcomes": 0-100,
    "access_to_care": 0-100,
    "care_coordination": 0-100,
    "preventive_care": 0-100
  },
  "hedis_measures": [
    {
      "measure": "string",
      "score": 0-100,
      "benchmark": 0-100,
      "gap": "string"
    }
  ],
  "quality_gaps": [
    {
      "area": "string",
      "severity": "low|medium|high",
      "impact": "string",
      "recommendation": "string"
    }
  ],
  "improvement_opportunities": ["string"],
  "star_rating": 1-5,
  "comparison_to_peers": "below|average|above"
}`
          },
          {
            role: 'user',
            content: JSON.stringify({
              appointments,
              outcomes,
              satisfaction,
              period
            })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const quality_metrics = JSON.parse(aiData.choices[0].message.content);

    // Store quality metrics
    await supabase.from('quality_metrics').insert({
      clinic_id: clinicId,
      period_start: period.start,
      period_end: period.end,
      overall_score: quality_metrics.overall_score,
      metrics_data: quality_metrics,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      quality_metrics
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Quality metrics tracking error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
