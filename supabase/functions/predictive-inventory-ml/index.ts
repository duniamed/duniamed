// UNLIMITED EDGE FUNCTION CAPACITIES: Predictive Inventory ML
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
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: inventory } = await supabase
      .from('clinic_inventory')
      .select('*')
      .eq('clinic_id', clinicId);

    const { data: usageHistory } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(100);

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
            content: 'Predict inventory needs and optimize ordering. Return JSON: { "predictions": [{"itemId": "", "predictedUsage": 0, "recommendedOrder": 0, "stockoutRisk": 0-1}], "orderRecommendations": [], "costOptimization": {}, "alerts": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ inventory, usageHistory, forecastDays })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const forecast = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, forecast }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Inventory prediction error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
