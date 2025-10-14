// UNLIMITED EDGE FUNCTION CAPACITIES: Regional Compliance Checker
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
    const { region, operation_type, data_handling } = await req.json();

    console.log(`Checking compliance for region: ${region}`);

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
            content: `Analyze regional healthcare compliance requirements. Return JSON with:
- compliant: Boolean overall compliance status
- regulations: Applicable regulations (GDPR, HIPAA, LGPD, etc.)
- requirements: Specific requirements for region
- violations: Potential compliance violations
- recommendations: Steps to achieve compliance
- data_residency: Data storage requirements`
          },
          {
            role: 'user',
            content: JSON.stringify({ region, operation_type, data_handling })
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const compliance_report = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, compliance_report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Regional compliance check error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
