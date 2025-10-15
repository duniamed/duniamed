// UNLIMITED EDGE FUNCTION CAPACITIES: Hospital Bed Management AI
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
    const { clinicId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current bed status
    const { data: beds } = await supabase
      .from('clinic_resources')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('resource_type', 'bed');

    // Get current appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, specialists(user_id, specialty)')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', new Date().toISOString())
      .lte('scheduled_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

    console.log('Bed management analysis:', { clinicId, bedCount: beds?.length });

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
            content: 'Analyze hospital bed management data and provide: available beds, utilization rate, predicted discharges in next 24h, allocation recommendations, emergency capacity reserve. Return JSON: { "availableBeds": 0, "occupiedBeds": 0, "utilizationRate": 0, "predictedDischarges": [], "allocationRecommendations": [], "emergencyCapacity": 0 }'
          },
          {
            role: 'user',
            content: JSON.stringify({ beds, appointments, clinicId })
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const bedData = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, bedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Bed management AI error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
