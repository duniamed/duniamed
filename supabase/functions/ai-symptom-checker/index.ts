import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { symptoms, patientInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing symptoms:', symptoms);

    const systemPrompt = `You are a medical AI triage assistant. Analyze patient symptoms and provide:
1. Possible conditions (ranked by likelihood)
2. Recommended specialty to consult
3. Urgency level (emergency, urgent, routine, non-urgent)
4. Red flags that need immediate attention
5. Questions for the doctor

Be clear this is NOT a diagnosis. Format response as JSON.`;

    const userPrompt = `Patient info: ${JSON.stringify(patientInfo)}
Symptoms: ${symptoms}

Provide triage assessment with possible conditions, recommended specialty, urgency level, and red flags.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_triage_assessment",
            description: "Provide medical triage assessment",
            parameters: {
              type: "object",
              properties: {
                possible_conditions: {
                  type: "array",
                  items: { type: "string" }
                },
                recommended_specialty: { type: "string" },
                urgency_level: {
                  type: "string",
                  enum: ["emergency", "urgent", "routine", "non-urgent"]
                },
                red_flags: {
                  type: "array",
                  items: { type: "string" }
                },
                questions_for_doctor: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["possible_conditions", "recommended_specialty", "urgency_level"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "provide_triage_assessment" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    const assessment = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    console.log('Assessment completed:', assessment);

    return new Response(JSON.stringify({ assessment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-symptom-checker:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
