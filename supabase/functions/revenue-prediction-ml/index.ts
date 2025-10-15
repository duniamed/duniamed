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

    const { clinicId, forecastMonths } = await req.json();

    // Fetch historical revenue data
    const { data: historicalRevenue } = await supabase
      .from('billing_transactions')
      .select('amount, created_at, payment_status, payment_method')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(1000);

    // Fetch appointment trends
    const { data: appointmentTrends } = await supabase
      .from('appointments')
      .select('scheduled_at, status, duration_minutes')
      .eq('clinic_id', clinicId)
      .order('scheduled_at', { ascending: false })
      .limit(500);

    // ML revenue prediction
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
            content: `Predict future revenue using ML analysis. Return JSON:
{
  "revenue_forecast": [
    {
      "month": "YYYY-MM",
      "predicted_revenue": number,
      "confidence_interval": {
        "low": number,
        "high": number
      },
      "growth_rate": number,
      "seasonal_factor": number
    }
  ],
  "key_drivers": [
    {
      "factor": "string",
      "impact_score": 0-1,
      "trend": "increasing|decreasing|stable"
    }
  ],
  "risk_factors": ["string"],
  "opportunities": ["string"],
  "model_accuracy": 0-100,
  "recommendations": ["string"]
}`
          },
          {
            role: 'user',
            content: JSON.stringify({
              historicalRevenue,
              appointmentTrends,
              forecastMonths
            })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const prediction = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({
      success: true,
      prediction,
      data_points_analyzed: (historicalRevenue?.length || 0) + (appointmentTrends?.length || 0)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Revenue prediction error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
