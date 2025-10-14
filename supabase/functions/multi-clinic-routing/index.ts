// UNLIMITED EDGE FUNCTION CAPACITIES: Multi-Clinic Patient Routing
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
    const { patientId, specialty, urgency, location } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Routing patient ${patientId} across clinics for specialty ${specialty}`);

    const { data: clinics } = await supabase
      .from('clinics')
      .select('*, specialists(id, specialty, availability_schedules)')
      .contains('specialties', [specialty])
      .eq('is_active', true);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Route patient to best clinic. Return JSON: { "clinic_id": "", "reason": "", "specialist_id": "", "estimated_wait": "" }' },
          { role: 'user', content: JSON.stringify({ clinics, urgency, location }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const routing = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, routing }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Multi-clinic routing error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
