// UNLIMITED EDGE FUNCTION CAPACITIES: Revenue Cycle Optimizer
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
    const { clinicId, timeframe } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: claims } = await supabase
      .from('claims')
      .select('*, payments(*)')
      .eq('clinic_id', clinicId)
      .gte('submitted_at', new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString());

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
            content: 'Analyze revenue cycle and suggest optimizations. Return JSON: { "denialRate": 0-1, "avgDaysToPayment": 0, "optimizations": [], "potentialRevenue": 0, "actionItems": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ claims })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Revenue cycle optimization error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
