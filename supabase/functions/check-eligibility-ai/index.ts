import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientId, insuranceProvider, memberNumber, serviceCode } = await req.json();

    console.log('Eligibility check request:', { patientId, insuranceProvider, serviceCode });

    // TODO: Integrate with real-time eligibility API
    // For now, return simulated response
    // Recommended vendors: Change Healthcare, Availity, Waystar
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simulated eligibility check (replace with actual API call)
    const eligibilityResult = {
      is_eligible: true,
      coverage_details: {
        plan_name: `${insuranceProvider} Gold Plan`,
        group_number: 'GRP12345',
        coverage_level: 'Family',
        effective_date: '2025-01-01',
        termination_date: null,
      },
      copay_amount: serviceCode === '99213' ? 25.00 : 50.00,
      deductible: 1000.00,
      deductible_met: 450.00,
      out_of_pocket_max: 5000.00,
      out_of_pocket_remaining: 4550.00,
      service_specific: {
        code: serviceCode,
        covered: true,
        prior_auth_required: false,
        in_network: true
      },
      check_date: new Date().toISOString(),
      response_code: '200',
      message: 'Active coverage verified'
    };

    // Log eligibility check
    await supabase.from('eligibility_checks').insert({
      patient_id: patientId,
      ...eligibilityResult
    });

    console.log('Eligibility check complete:', eligibilityResult.is_eligible);

    return new Response(
      JSON.stringify(eligibilityResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-eligibility-ai:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        is_eligible: false,
        message: 'Unable to verify eligibility. Please contact your insurance provider.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
