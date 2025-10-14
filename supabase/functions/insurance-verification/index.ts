// UNLIMITED EDGE FUNCTION CAPACITIES: Insurance Verification
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
    const { patientId, insuranceDetails, appointmentId } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Verifying insurance for patient ${patientId}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Verify insurance coverage. Return JSON: { "verified": boolean, "coverage_percentage": number, "copay_amount": number, "deductible_remaining": number, "out_of_pocket_max": number, "covered_services": [], "exclusions": [], "pre_auth_required": boolean }' },
          { role: 'user', content: JSON.stringify(insuranceDetails) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const verification = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('insurance_verifications').insert({
      patient_id: patientId,
      appointment_id: appointmentId,
      verified: verification.verified,
      coverage_data: verification,
      verified_at: new Date().toISOString()
    });

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
