// UNLIMITED EDGE FUNCTION CAPACITIES: AI Medication Interaction Checker
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
    const { medications } = await req.json();

    console.log(`Checking interactions for ${medications.length} medications`);

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
            content: `Analyze medication interactions and contraindications. Return JSON with:
- interactions: Array of potential drug interactions with severity levels
- contraindications: Array of contraindications
- warnings: Array of warnings and precautions
- recommendations: Array of clinical recommendations`
          },
          {
            role: 'user',
            content: `Analyze these medications: ${JSON.stringify(medications)}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Medication interaction check error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
