// UNLIMITED EDGE FUNCTION CAPACITIES: Automated Medical Coding
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
    const { appointmentId, clinicalNotes, diagnosis, procedures } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
            content: 'Extract medical billing codes from clinical documentation. Return JSON: { "icd10Codes": [{"code": "", "description": "", "confidence": 0-1}], "cptCodes": [{"code": "", "description": "", "units": 1, "confidence": 0-1}], "hcpcsCodes": [], "modifiers": [], "drgCode": "", "reimbursementEstimate": 0, "complianceFlags": [], "documentationGaps": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ clinicalNotes, diagnosis, procedures })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const codes = JSON.parse(aiData.choices[0].message.content);

    await supabase
      .from('billing_codes')
      .insert({
        appointment_id: appointmentId,
        icd10_codes: codes.icd10Codes,
        cpt_codes: codes.cptCodes,
        hcpcs_codes: codes.hcpcsCodes,
        modifiers: codes.modifiers,
        drg_code: codes.drgCode,
        estimated_reimbursement: codes.reimbursementEstimate,
        ai_confidence: codes.icd10Codes[0]?.confidence || 0
      });

    return new Response(JSON.stringify({ success: true, codes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Medical coding error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
