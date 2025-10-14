// UNLIMITED EDGE FUNCTION CAPACITIES: Voice to Prescription
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { voice_text } = await req.json();

    console.log(`Converting voice to prescription: ${voice_text}`);

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
            content: `Extract prescription details from voice input. Return JSON with:
- medication_name: Drug name
- dosage: Dosage amount and unit
- frequency: How often (e.g., "twice daily")
- duration: Treatment duration
- instructions: Special instructions
- route: Administration route (oral, topical, etc.)
- refills: Number of refills
- warnings: Drug interactions or warnings`
          },
          {
            role: 'user',
            content: voice_text
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const prescription = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, prescription }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Voice to prescription error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
