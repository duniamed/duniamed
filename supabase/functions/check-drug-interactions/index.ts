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
    const { newMedication, currentMedications, allergies } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Checking interactions for ${newMedication} with ${currentMedications.length} current medications`);

    // Call Lovable AI to check drug interactions
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
            content: `You are a clinical pharmacology expert. Check for drug-drug interactions and contraindications.

For each interaction found, provide:
- severity: minor, moderate, major, or contraindicated
- interactingDrug: name of the drug it interacts with
- description: brief explanation of the interaction mechanism
- clinicalGuidance: specific recommendations (dose adjustment, monitoring, alternative drug, etc.)
- references: array of medical sources (optional)

Return JSON with: { interactions: [...] }

Severity definitions:
- minor: No clinical intervention needed
- moderate: Monitor patient, may require dose adjustment
- major: Significant clinical concern, avoid combination if possible
- contraindicated: Absolutely do NOT combine`
          },
          {
            role: 'user',
            content: `Check interactions for:
New medication: ${newMedication}
Current medications: ${currentMedications.join(', ')}
Patient allergies: ${allergies.join(', ')}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'check_drug_interactions',
              description: 'Return drug interaction analysis',
              parameters: {
                type: 'object',
                properties: {
                  interactions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        severity: { 
                          type: 'string', 
                          enum: ['minor', 'moderate', 'major', 'contraindicated'] 
                        },
                        interactingDrug: { type: 'string' },
                        description: { type: 'string' },
                        clinicalGuidance: { type: 'string' },
                        references: { 
                          type: 'array', 
                          items: { type: 'string' } 
                        }
                      },
                      required: ['severity', 'interactingDrug', 'description', 'clinicalGuidance'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['interactions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'check_drug_interactions' } }
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
      throw new Error('Failed to check drug interactions');
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No interaction data returned from AI');
    }

    const result = JSON.parse(toolCall.function.arguments);

    console.log(`Found ${result.interactions.length} interactions`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Drug interaction check error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        interactions: [] 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});