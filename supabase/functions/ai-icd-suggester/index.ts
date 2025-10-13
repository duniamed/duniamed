import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { soapText, symptoms, chiefComplaint } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context from SOAP note and symptoms
    const context = `
Chief Complaint: ${chiefComplaint || 'Not specified'}
Symptoms: ${symptoms ? JSON.stringify(symptoms) : 'Not specified'}
SOAP Note: ${soapText || 'In progress...'}
    `.trim();

    // Call Lovable AI to suggest ICD-10 codes
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an ICD-10 code suggestion expert. Based on clinical documentation, suggest the most relevant ICD-10 codes with confidence scores.

Return suggestions in this JSON format:
{
  "suggestions": [
    {
      "code": "J06.9",
      "description": "Acute upper respiratory infection, unspecified",
      "confidence": 0.92,
      "reasoning": "Chief complaint of sore throat and nasal congestion indicates upper respiratory infection"
    }
  ]
}

Guidelines:
- Suggest 3-5 most relevant codes
- Confidence scores: 0.9+ = highly likely, 0.7-0.9 = probable, 0.5-0.7 = possible
- Include brief clinical reasoning
- Prioritize specificity (more specific codes when applicable)
- Flag if more information needed for specific coding`
          },
          {
            role: 'user',
            content: `Based on this clinical information, suggest ICD-10 codes:\n\n${context}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_icd10_codes',
              description: 'Return ICD-10 code suggestions with confidence scores',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        code: { type: 'string', description: 'ICD-10 code (e.g., J06.9)' },
                        description: { type: 'string', description: 'Full description of the code' },
                        confidence: { type: 'number', description: 'Confidence score 0-1' },
                        reasoning: { type: 'string', description: 'Clinical reasoning for this code' }
                      },
                      required: ['code', 'description', 'confidence', 'reasoning'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['suggestions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_icd10_codes' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI usage quota exceeded. Please add credits to your workspace.');
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('Failed to generate ICD-10 suggestions');
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No ICD-10 suggestions returned from AI');
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('ICD-10 suggestion error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: [] 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
