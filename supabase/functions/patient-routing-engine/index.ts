// UNLIMITED EDGE FUNCTION CAPACITIES: Patient Routing Engine
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
    const { patient_data, symptoms, urgency } = await req.json();

    console.log(`Routing patient with urgency: ${urgency}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch available specialists
    const { data: specialists } = await supabase
      .from('specialists')
      .select('*, availability_schedules(*)')
      .eq('is_accepting_patients', true);

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
            content: `Route patient to best specialist. Return JSON with:
- recommended_specialists: Array of {specialist_id, match_score, reasoning}
- urgency_assessment: Updated urgency level
- routing_priority: High/Medium/Low
- alternative_options: Backup specialists
- wait_time_estimate: Estimated wait time`
          },
          {
            role: 'user',
            content: `Patient: ${JSON.stringify(patient_data)}\nSymptoms: ${symptoms}\nUrgency: ${urgency}\nSpecialists: ${JSON.stringify(specialists)}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const routing = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, routing }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Patient routing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
