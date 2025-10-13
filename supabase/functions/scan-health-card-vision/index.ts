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
    const { imageBase64, cardSide } = await req.json();

    if (!imageBase64) {
      throw new Error('Image data is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI with vision capability (Gemini 2.5 Flash)
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
            content: `You are an OCR expert specialized in extracting information from health insurance cards.

Extract these fields from the insurance card image:
- Patient Name (full legal name)
- Policy Number (12-16 digit number)
- Member ID
- Group Number
- Insurer/Plan Name (e.g., SulAmérica, Unimed, Aetna, UnitedHealthcare)
- Effective Date / Start Date
- Expiration Date
- CPF (Brazil - validate checksum)
- Social Security Number (USA - last 4 digits only)
- NHS Number (UK)
- ID Nacional / DNI (other countries)
- Phone Number (customer service)
- Co-pay amounts (if visible)

Return confidence score (0-100%) for each field. If a field is not visible or unclear, return null with low confidence.

Special validation:
- CPF: Must be 11 digits, validate checksum
- Policy numbers: Must be numeric
- Dates: Parse MM/YY or MM/YYYY format
- Names: Capitalize properly

Return in this JSON format:
{
  "fields": {
    "patientName": {"value": "string", "confidence": 95},
    "policyNumber": {"value": "string", "confidence": 92},
    "memberId": {"value": "string", "confidence": 88},
    "groupNumber": {"value": "string", "confidence": 90},
    "insurerName": {"value": "string", "confidence": 98},
    "effectiveDate": {"value": "YYYY-MM-DD", "confidence": 85},
    "expirationDate": {"value": "YYYY-MM-DD", "confidence": 85},
    "cpf": {"value": "string", "confidence": 92},
    "phoneNumber": {"value": "string", "confidence": 80}
  },
  "cardSide": "front" or "back",
  "insurerDetected": "SulAmérica" (specific insurer name),
  "overallConfidence": 88,
  "needsManualReview": false,
  "warnings": []
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all information from this health insurance card (${cardSide} side):`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_insurance_card_data',
              description: 'Extract structured data from health insurance card',
              parameters: {
                type: 'object',
                properties: {
                  fields: {
                    type: 'object',
                    properties: {
                      patientName: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          confidence: { type: 'number' }
                        }
                      },
                      policyNumber: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          confidence: { type: 'number' }
                        }
                      },
                      memberId: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          confidence: { type: 'number' }
                        }
                      },
                      groupNumber: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          confidence: { type: 'number' }
                        }
                      },
                      insurerName: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          confidence: { type: 'number' }
                        }
                      },
                      effectiveDate: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          confidence: { type: 'number' }
                        }
                      },
                      expirationDate: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          confidence: { type: 'number' }
                        }
                      },
                      cpf: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          confidence: { type: 'number' }
                        }
                      },
                      phoneNumber: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          confidence: { type: 'number' }
                        }
                      }
                    }
                  },
                  cardSide: { type: 'string' },
                  insurerDetected: { type: 'string' },
                  overallConfidence: { type: 'number' },
                  needsManualReview: { type: 'boolean' },
                  warnings: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['fields', 'overallConfidence'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_insurance_card_data' } }
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
      throw new Error('Failed to process insurance card image');
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No data extracted from insurance card');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    // Validate CPF if present (Brazil)
    if (extractedData.fields?.cpf?.value) {
      const cpf = extractedData.fields.cpf.value.replace(/\D/g, '');
      if (cpf.length === 11) {
        const isValidCPF = validateCPF(cpf);
        if (!isValidCPF) {
          extractedData.warnings = extractedData.warnings || [];
          extractedData.warnings.push('CPF checksum validation failed');
          extractedData.fields.cpf.confidence = Math.min(extractedData.fields.cpf.confidence, 50);
        }
      }
    }

    // Flag for manual review if overall confidence < 85%
    if (extractedData.overallConfidence < 85) {
      extractedData.needsManualReview = true;
      extractedData.warnings = extractedData.warnings || [];
      extractedData.warnings.push('Low confidence - manual review recommended');
    }

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Insurance card OCR error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        fields: {},
        overallConfidence: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// CPF validation function (Brazil)
function validateCPF(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}
