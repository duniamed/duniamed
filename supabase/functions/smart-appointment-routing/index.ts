// UNLIMITED EDGE FUNCTION CAPACITIES: Smart Appointment Routing
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
    const { patient_id, symptoms, urgency, preferences } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: specialists } = await supabase
      .from('specialists')
      .select('*, availability_schedules(*), reviews(rating)')
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
            content: `Route patient to best specialist based on symptoms, availability, ratings, and preferences. Return JSON with:
- recommended_specialist_id: Best match specialist ID
- routing_score: 0-100 match score
- reasoning: Why this specialist was chosen
- alternative_specialists: Array of backup options with scores
- optimal_time_slot: Suggested appointment time
- expected_wait_time_minutes: Estimated wait`
          },
          {
            role: 'user',
            content: JSON.stringify({ symptoms, urgency, specialists, preferences })
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const routing = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, routing }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Smart routing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
