// UNLIMITED EDGE FUNCTION CAPACITIES: Staff Utilization Tracker
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
    const { clinicId, period } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: staff } = await supabase
      .from('clinic_staff')
      .select('*, profiles(*), specialists(*)')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', period.start)
      .lte('scheduled_at', period.end);

    console.log('Tracking staff utilization:', { clinicId, staffCount: staff?.length });

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
            content: 'Track and optimize staff utilization. Calculate availability, appointment load, efficiency. Return JSON: { "staff_metrics": [{"staffId": "", "name": "", "utilization": 0-100, "appointments_handled": 0, "available_hours": 0, "efficiency_score": 0-100}], "overall_utilization": 0-100, "bottlenecks": [], "optimization_suggestions": [], "capacity_forecast": {} }'
          },
          {
            role: 'user',
            content: JSON.stringify({ clinicId, period, staff, appointments })
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
    const utilization = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, utilization }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Staff utilization error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
