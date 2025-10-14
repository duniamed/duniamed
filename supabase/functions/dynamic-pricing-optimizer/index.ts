// UNLIMITED EDGE FUNCTION CAPACITIES: Dynamic Pricing Optimizer
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
    const { service_type, time_slot, specialist_id } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: metrics } = await supabase
      .from('appointments')
      .select('fee, scheduled_at, status')
      .gte('scheduled_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

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
            content: `Optimize pricing based on demand, time, and historical data. Return JSON with:
- optimal_price: Recommended price
- price_range: {min, max} acceptable range
- demand_factor: 0-1 current demand level
- surge_multiplier: Price multiplier (1.0 = normal)
- competitor_analysis: Comparison to market rates
- revenue_impact: Estimated revenue change
- booking_probability: Likelihood of booking at this price`
          },
          {
            role: 'user',
            content: JSON.stringify({ service_type, time_slot, metrics })
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const pricing = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, pricing }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Dynamic pricing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
