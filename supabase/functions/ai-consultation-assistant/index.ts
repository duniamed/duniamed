import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { soapContent, patientHistory } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating consultation suggestions...');

    // Use Lovable AI to suggest ICD-10 codes, prescriptions, and treatments
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          {
            role: 'system',
            content: `You are a medical AI assistant helping specialists with evidence-based clinical decision support.
Provide:
1. Relevant ICD-10 codes with descriptions
2. Evidence-based treatment protocols
3. Prescription suggestions (generic names, dosages, duration)
4. Recommended lab tests/imaging
5. Follow-up timing recommendations

Always cite medical evidence and guidelines when available.`
          },
          {
            role: 'user',
            content: `Based on this consultation:

SOAP Note:
${JSON.stringify(soapContent, null, 2)}

Patient History:
${JSON.stringify(patientHistory, null, 2)}

Provide clinical decision support in JSON format:
{
  "icd10_codes": [{"code": "", "description": "", "evidence": ""}],
  "treatment_protocol": {"summary": "", "steps": []},
  "prescriptions": [{"medication": "", "dosage": "", "duration": "", "instructions": ""}],
  "lab_tests": [{"test": "", "indication": ""}],
  "follow_up": {"timing": "", "reason": ""}
}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI assistant error:', error);
      throw new Error('AI consultation assistance failed');
    }

    const aiResponse = await response.json();
    const suggestions = JSON.parse(aiResponse.choices[0].message.content);

    return new Response(JSON.stringify({
      success: true,
      suggestions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Consultation assistant error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});