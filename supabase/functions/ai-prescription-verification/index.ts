// UNLIMITED EDGE FUNCTION CAPACITIES: AI Prescription Verification
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
    const { prescriptionId, patientHistory, currentMedications } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Verifying prescription ${prescriptionId}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'Verify prescription safety. Return JSON: { "approved": boolean, "warnings": [], "interactions": [], "contraindications": [], "dosage_check": "", "alternative_suggestions": [] }' },
          { role: 'user', content: JSON.stringify({ patientHistory, currentMedications }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const verification = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('prescription_verifications').insert({
      prescription_id: prescriptionId,
      approved: verification.approved,
      warnings: verification.warnings,
      interactions: verification.interactions,
      verified_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, verification }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Prescription verification error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
