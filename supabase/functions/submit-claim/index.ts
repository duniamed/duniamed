import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claimId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: claim, error } = await supabase
      .from("insurance_claims")
      .select("*")
      .eq("id", claimId)
      .single();

    if (error) throw error;

    // Format claim for 837 EDI standard
    const ediClaim = {
      claimNumber: claim.claim_number,
      payerId: claim.payer_id,
      serviceDate: claim.service_date,
      diagnosisCodes: claim.diagnosis_codes,
      procedureCodes: claim.procedure_codes,
      billedAmount: claim.billed_amount,
    };

    // Simulate submission to clearinghouse
    console.log("Submitting claim to clearinghouse:", ediClaim);
    
    const submissionResult = {
      success: true,
      submissionId: `SUB-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    await supabase
      .from("insurance_claims")
      .update({
        status: "submitted",
        submission_date: new Date().toISOString(),
        claim_data: { ...claim.claim_data, submission: submissionResult },
      })
      .eq("id", claimId);

    return new Response(
      JSON.stringify({ success: true, result: submissionResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Claim submission error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});