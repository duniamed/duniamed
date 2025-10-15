// UNLIMITED EDGE FUNCTION CAPACITIES: Revenue Cycle Management
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
    const { clinicId, period, action } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: claims } = await supabase
      .from('insurance_claims')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('created_at', period.start)
      .lte('created_at', period.end);

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .gte('created_at', period.start)
      .lte('created_at', period.end);

    console.log('Analyzing revenue cycle:', { clinicId, claimsCount: claims?.length });

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
            content: 'Analyze revenue cycle performance. Return JSON: { "totalRevenue": 0, "outstandingClaims": 0, "denialRate": 0-100, "averageDaysToPayment": 0, "collectionRate": 0-100, "arAgingAnalysis": {}, "denialReasons": [], "recommendations": [], "predictedRevenue": 0, "cashFlowForecast": [], "bottlenecks": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ clinicId, period, claims, payments, action })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const rcm = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, rcm }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Revenue cycle management error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
