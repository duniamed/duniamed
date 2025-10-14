// UNLIMITED EDGE FUNCTION CAPACITIES: Voice Session Summary
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
    const { session_transcript, patient_id } = await req.json();

    console.log(`Generating session summary for patient: ${patient_id}`);

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
            content: `Generate comprehensive consultation summary. Return JSON with:
- chief_complaint: Main reason for visit
- symptoms: Array of symptoms discussed
- diagnoses: Preliminary or confirmed diagnoses
- prescriptions: Medications prescribed
- follow_up: Follow-up plan
- duration_minutes: Estimated consultation time
- key_findings: Important clinical findings`
          },
          {
            role: 'user',
            content: session_transcript
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const summary = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Voice session summary error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
