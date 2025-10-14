// UNLIMITED EDGE FUNCTION CAPACITIES: ML-Based Capacity Forecasting
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
    const { clinicId, forecastDays } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Forecasting capacity for clinic ${clinicId} for ${forecastDays} days`);

    const { data: historicalData } = await supabase
      .from('capacity_metrics')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('date', { ascending: false })
      .limit(90);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'Forecast clinic capacity using time series analysis. Return JSON: { "forecast": [{"date": "YYYY-MM-DD", "predicted_utilization": 0-100, "predicted_appointments": number, "confidence_interval": [low, high]}], "trends": [], "recommendations": [] }' },
          { role: 'user', content: JSON.stringify({ historicalData, forecastDays }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const forecast = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, forecast }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Capacity forecasting error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
