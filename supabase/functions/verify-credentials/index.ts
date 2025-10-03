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
    const { specialistId, verificationType, licenseNumber, state } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Simulated credential verification
    // In production, integrate with state medical boards, NPPES, CAQH, etc.
    const verificationResult = {
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      verification_data: {
        licenseNumber: licenseNumber,
        state: state,
        status: 'active',
        issueDate: '2020-01-01',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        disciplinaryActions: [],
        verificationSource: 'State Medical Board',
        verifiedAt: new Date().toISOString()
      },
      next_check_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days
    };

    const { data: verification, error } = await supabase
      .from('credential_verifications')
      .insert({
        specialist_id: specialistId,
        verification_type: verificationType,
        ...verificationResult
      })
      .select()
      .single();

    if (error) throw error;

    // Update specialist verification status
    const { error: updateError } = await supabase
      .from('specialists')
      .update({ verification_status: 'verified' })
      .eq('id', specialistId);

    if (updateError) console.error('Update specialist error:', updateError);

    return new Response(
      JSON.stringify(verification),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Credential verification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
