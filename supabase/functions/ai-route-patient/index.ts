// UNLIMITED EDGE FUNCTION CAPACITIES: AI Patient Routing
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
    const { patientId, symptoms, urgency, preferredSpecialty } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    // Get available specialists
    const { data: specialists } = await supabase
      .from('specialists')
      .select('id, specialty, sub_specialty, languages, is_accepting_patients')
      .eq('is_accepting_patients', true)
      .eq('verification_status', 'verified');

    // Get live specialists
    const { data: liveSpecialists } = await supabase
      .from('specialist_live_status')
      .select('specialist_id, current_queue_size, fatigue_score')
      .eq('is_live', true);

    console.log(`Routing patient ${patientId} with symptoms: ${JSON.stringify(symptoms)}`);

    // Use AI to match patient to best specialist
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a medical triage AI. Match patients to the most appropriate specialist based on:
- Symptoms and urgency
- Specialist availability and queue size
- Specialist fatigue levels
- Language preferences
- Specialty match

Return JSON: { "specialist_id": "uuid", "confidence": 0.0-1.0, "reasoning": "explanation" }`
          },
          {
            role: 'user',
            content: JSON.stringify({
              symptoms,
              urgency,
              preferredSpecialty,
              availableSpecialists: specialists,
              liveSpecialists
            })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const routing = JSON.parse(aiData.choices[0].message.content);

    // Add to queue
    await supabase.from('patient_queue').insert({
      patient_id: patientId,
      specialist_id: routing.specialist_id,
      status: 'waiting',
      priority: urgency === 'high' ? 1 : urgency === 'medium' ? 2 : 3,
      ai_routing_confidence: routing.confidence,
      ai_routing_reason: routing.reasoning
    });

    return new Response(JSON.stringify({
      success: true,
      routing
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('AI routing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
