// UNLIMITED EDGE FUNCTION CAPACITIES: Smart Resource Allocator
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
    const { clinicId, date, appointments } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: resources } = await supabase
      .from('clinic_resources')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

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
            content: 'Optimize resource allocation (rooms, equipment, staff) for clinic appointments. Return JSON: { "allocations": [{"appointmentId": "", "resourceId": "", "startTime": "", "endTime": ""}], "conflicts": [], "utilizationScore": 0-100, "recommendations": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ appointments, resources, date })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const allocation = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, allocation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Resource allocation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
