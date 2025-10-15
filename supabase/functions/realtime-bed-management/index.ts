// UNLIMITED EDGE FUNCTION CAPACITIES: Realtime Bed Management
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
    const { clinicId, action, bedId, patientId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: beds } = await supabase
      .from('clinic_resources')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('resource_type', 'bed');

    const { data: admissions } = await supabase
      .from('patient_admissions')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'active');

    console.log('Bed management:', { clinicId, action, availableBeds: beds?.length });

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
            content: 'Optimize bed allocation and predict capacity needs. Return JSON: { "availableBeds": [], "occupiedBeds": [], "predictedDischarges": [], "capacityForecast": {}, "allocationRecommendations": [], "transferSuggestions": [], "emergencyCapacity": 0, "utilization": 0-100 }'
          },
          {
            role: 'user',
            content: JSON.stringify({ clinicId, beds, admissions, action, bedId, patientId })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const bedManagement = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, bedManagement }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Bed management error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
