// UNLIMITED EDGE FUNCTION CAPACITIES: AI Insurance Verification
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
    const { insurance_card_image, patient_info, service_codes } = await req.json();

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
            content: `Verify insurance coverage and extract information. Return JSON with:
- insurance_provider: Provider name
- policy_number: Policy/member ID
- group_number: Group ID
- coverage_status: active/inactive/pending
- copay_amount: Patient responsibility
- deductible_remaining: Remaining deductible
- covered_services: Array of covered services
- prior_auth_required: Boolean if auth needed
- effective_dates: Coverage period
- verification_confidence: 0-1 confidence score`
          },
          {
            role: 'user',
            content: JSON.stringify({ patient_info, service_codes })
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const verification = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, verification }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Insurance verification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
