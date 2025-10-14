// UNLIMITED EDGE FUNCTION CAPACITIES: AI Lab Result Interpreter
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
    const { lab_results, patient_context } = await req.json();

    console.log(`Interpreting lab results`);

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
            content: `Interpret laboratory results in clinical context. Return JSON with:
- summary: Overall interpretation summary
- abnormal_findings: Array of abnormal results with clinical significance
- trends: Trends over time if historical data available
- clinical_implications: What these results mean clinically
- follow_up: Recommended follow-up tests or actions
- patient_explanation: Simplified explanation for patients`
          },
          {
            role: 'user',
            content: `Lab results: ${JSON.stringify(lab_results)}\nPatient context: ${JSON.stringify(patient_context)}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const interpretation = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, interpretation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Lab result interpretation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
