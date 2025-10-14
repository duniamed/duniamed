// UNLIMITED EDGE FUNCTION CAPACITIES: Earnings Analytics
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
    const { entity_id, entity_type, time_range } = await req.json();

    console.log(`Analyzing earnings for ${entity_type}: ${entity_id}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch payment data
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .gte('created_at', time_range.start)
      .lte('created_at', time_range.end);

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
            content: `Analyze earnings and forecast. Return JSON with:
- total_earnings: Total amount earned
- forecast_next_month: Predicted earnings
- trends: Growth trends and patterns
- revenue_by_service: Breakdown by service type
- recommendations: Revenue optimization suggestions
- seasonal_patterns: Identified seasonal patterns`
          },
          {
            role: 'user',
            content: `Payments: ${JSON.stringify(payments)}\nTime range: ${JSON.stringify(time_range)}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const analytics = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, analytics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Earnings analytics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
