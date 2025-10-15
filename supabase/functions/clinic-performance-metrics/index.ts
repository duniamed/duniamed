// UNLIMITED EDGE FUNCTION CAPACITIES: Clinic Performance Metrics
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
    const { clinicId, period, metrics } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', period.start)
      .lte('scheduled_at', period.end);

    const { data: patients } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient');

    const { data: specialists } = await supabase
      .from('specialists')
      .select('*');

    console.log('Calculating clinic metrics:', { clinicId, appointmentCount: appointments?.length });

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
            content: 'Analyze clinic performance metrics: patient satisfaction, specialist productivity, revenue, utilization, wait times. Return JSON: { "overall_score": 0-100, "patient_satisfaction": 0-100, "specialist_productivity": 0-100, "revenue_performance": {}, "utilization_rate": 0-100, "wait_time_avg": 0, "trends": [], "recommendations": [], "benchmarks": {} }'
          },
          {
            role: 'user',
            content: JSON.stringify({ clinicId, period, appointments, patients, specialists, metrics })
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const performance = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, performance }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Performance metrics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
