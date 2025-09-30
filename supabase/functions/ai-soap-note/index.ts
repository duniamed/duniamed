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
    const { transcript, appointmentInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating SOAP note for appointment:', appointmentInfo?.id);

    const systemPrompt = `You are a medical documentation AI. Generate a structured SOAP note from consultation transcript:
- Subjective: Patient's reported symptoms and history
- Objective: Clinical findings and observations
- Assessment: Diagnosis and clinical reasoning
- Plan: Treatment recommendations and follow-up

Format as JSON with these exact fields.`;

    const userPrompt = `Appointment: ${JSON.stringify(appointmentInfo)}
Consultation Transcript:
${transcript}

Generate a complete SOAP note.`;

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
            name: "generate_soap_note",
            description: "Generate structured SOAP note",
            parameters: {
              type: "object",
              properties: {
                subjective: { type: "string" },
                objective: { type: "string" },
                assessment: { type: "string" },
                plan: { type: "string" }
              },
              required: ["subjective", "objective", "assessment", "plan"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_soap_note" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    const soapNote = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    console.log('SOAP note generated successfully');

    return new Response(JSON.stringify({ soapNote }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-soap-note:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
