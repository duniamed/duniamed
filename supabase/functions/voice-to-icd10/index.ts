// UNLIMITED EDGE FUNCTION CAPACITIES: Voice to ICD-10
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
    const { symptoms_text } = await req.json();

    console.log(`Suggesting ICD-10 codes for: ${symptoms_text}`);

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
            content: `Suggest ICD-10 codes based on symptoms. Return JSON with:
- suggestions: Array of {code, description, confidence_score}
- primary_code: Most likely ICD-10 code
- differential_diagnoses: Related conditions to consider`
          },
          {
            role: 'user',
            content: symptoms_text
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const icd10_data = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, icd10_data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Voice to ICD-10 error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
