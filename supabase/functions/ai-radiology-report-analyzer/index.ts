// UNLIMITED EDGE FUNCTION CAPACITIES: AI Radiology Report Analyzer
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
    const { radiology_report, imaging_type, clinical_indication } = await req.json();

    console.log(`Analyzing ${imaging_type} radiology report`);

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
            content: `Analyze radiology reports and extract key findings. Return JSON with:
- key_findings: Array of significant findings
- impression: Clinical impression
- recommendations: Follow-up recommendations
- urgency: Urgency level (routine, urgent, emergent)
- structured_data: Structured extraction of measurements and observations
- patient_summary: Simplified explanation for patients`
          },
          {
            role: 'user',
            content: `Imaging type: ${imaging_type}\nClinical indication: ${clinical_indication}\nReport: ${radiology_report}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Radiology report analysis error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
