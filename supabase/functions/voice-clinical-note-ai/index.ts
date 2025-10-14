// UNLIMITED EDGE FUNCTION CAPACITIES: Voice Clinical Note AI
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
    const { audioTranscript, patientContext, appointmentType } = await req.json();

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: 'Convert voice transcript to structured clinical note with SOAP format, ICD codes, billing codes. Return JSON: { "soap": {"subjective": "", "objective": "", "assessment": "", "plan": ""}, "icdCodes": [], "cptCodes": [], "medications": [], "followUp": {}, "redFlags": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ audioTranscript, patientContext, appointmentType })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const clinicalNote = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, clinicalNote }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Voice clinical note error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
