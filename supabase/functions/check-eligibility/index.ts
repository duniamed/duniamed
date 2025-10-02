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
    const { patientId, payerId, memberId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Real implementation with Change Healthcare / Optum API:
    // const clearinghouseApiKey = Deno.env.get("CLEARINGHOUSE_API_KEY");
    // const clearinghouseUrl = "https://api.changehealthcare.com/medicalnetwork/eligibility/v3";
    // 
    // const eligibilityRequest = {
    //   controlNumber: `${Date.now()}`,
    //   tradingPartnerServiceId: payerId,
    //   provider: {
    //     npi: "YOUR_PROVIDER_NPI",
    //   },
    //   subscriber: {
    //     memberId: memberId,
    //     firstName: "Patient",
    //     lastName: "Name",
    //     dateOfBirth: "1990-01-01",
    //   },
    //   encounter: {
    //     serviceTypeCodes: ["30"], // Health benefit plan coverage
    //   },
    // };
    //
    // const response = await fetch(clearinghouseUrl, {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${clearinghouseApiKey}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(eligibilityRequest),
    // });
    //
    // const eligibilityData = await response.json();

    console.log("Checking eligibility for:", { patientId, payerId, memberId });

    // Simulated API response (X12 270/271 transaction converted to JSON)
    const eligibilityResponse = {
      isEligible: Math.random() > 0.2,
      coverageDetails: {
        planType: "PPO",
        planName: "Premium Health Plan",
        effectiveDate: "2024-01-01",
        terminationDate: "2024-12-31",
      },
      copayAmount: 25,
      deductibleRemaining: 500,
      outOfPocketRemaining: 2000,
      planDetails: {
        preventiveCare: "Covered 100%",
        officeCopay: "$25",
        emergencyRoom: "$250",
        prescriptions: "Tier 1: $10, Tier 2: $30",
      },
    };

    const { data, error } = await supabase
      .from("eligibility_checks")
      .insert({
        patient_id: patientId,
        payer_id: payerId,
        member_id: memberId,
        is_eligible: eligibilityResponse.isEligible,
        coverage_details: eligibilityResponse.coverageDetails,
        copay_amount: eligibilityResponse.copayAmount,
        deductible_remaining: eligibilityResponse.deductibleRemaining,
        out_of_pocket_remaining: eligibilityResponse.outOfPocketRemaining,
        plan_details: eligibilityResponse.planDetails,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, eligibility: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Eligibility check error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});