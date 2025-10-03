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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { specialist_id, appointment_type, estimated_cost } = await req.json();

    console.log('Insurance verification before booking:', { 
      patient: user.id, 
      specialist_id, 
      appointment_type 
    });

    // Check if patient has insurance information
    const { data: insuranceData, error: insuranceError } = await supabase
      .from('patient_insurance')
      .select('*')
      .eq('patient_id', user.id)
      .eq('is_active', true)
      .single();

    if (insuranceError && insuranceError.code !== 'PGRST116') {
      throw insuranceError;
    }

    if (!insuranceData) {
      return new Response(JSON.stringify({
        verified: false,
        requires_action: true,
        action_type: 'add_insurance',
        message: 'Please add your insurance information before booking.',
        estimated_out_of_pocket: estimated_cost || 0,
        redirect_url: '/patient/insurance-check'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if we have a recent verification (within 24 hours)
    const { data: recentVerification, error: verificationError } = await supabase
      .from('insurance_verifications')
      .select('*')
      .eq('insurance_id', insuranceData.id)
      .gte('verified_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('verified_at', { ascending: false })
      .limit(1)
      .single();

    if (verificationError && verificationError.code !== 'PGRST116') {
      console.error('Error fetching verification:', verificationError);
    }

    if (recentVerification && recentVerification.status === 'verified') {
      // Insurance verified recently
      return new Response(JSON.stringify({
        verified: true,
        requires_action: false,
        insurance_details: {
          provider: insuranceData.provider_name,
          policy_number: insuranceData.policy_number,
          coverage_status: recentVerification.coverage_details?.status || 'active',
          copay: recentVerification.coverage_details?.copay || 0,
          deductible_remaining: recentVerification.coverage_details?.deductible_remaining || 0,
        },
        estimated_out_of_pocket: recentVerification.coverage_details?.copay || estimated_cost * 0.2,
        message: 'Insurance verified. You can proceed with booking.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Need to verify insurance - trigger real-time verification
    console.log('Triggering insurance eligibility check...');
    
    const { data: eligibilityData, error: eligibilityError } = await supabase.functions.invoke(
      'check-insurance-eligibility',
      {
        body: {
          patient_id: user.id,
          insurance_id: insuranceData.id,
          specialist_id,
          service_type: appointment_type
        }
      }
    );

    if (eligibilityError) {
      console.error('Eligibility check error:', eligibilityError);
      // Allow booking but warn about verification
      return new Response(JSON.stringify({
        verified: false,
        requires_action: false,
        warning: true,
        message: 'Unable to verify insurance. You may proceed but coverage is not guaranteed.',
        estimated_out_of_pocket: estimated_cost || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store verification result
    const verificationRecord = {
      insurance_id: insuranceData.id,
      verified_at: new Date().toISOString(),
      status: eligibilityData.eligible ? 'verified' : 'denied',
      coverage_details: eligibilityData.coverage_details,
      verification_method: 'api',
    };

    await supabase
      .from('insurance_verifications')
      .insert(verificationRecord);

    if (!eligibilityData.eligible) {
      return new Response(JSON.stringify({
        verified: false,
        requires_action: true,
        action_type: 'insurance_issue',
        message: eligibilityData.message || 'Insurance verification failed. Please contact your provider.',
        estimated_out_of_pocket: estimated_cost || 0,
        issues: eligibilityData.issues || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      verified: true,
      requires_action: false,
      insurance_details: {
        provider: insuranceData.provider_name,
        policy_number: insuranceData.policy_number,
        coverage_status: 'active',
        copay: eligibilityData.coverage_details?.copay || 0,
        deductible_remaining: eligibilityData.coverage_details?.deductible_remaining || 0,
      },
      estimated_out_of_pocket: eligibilityData.coverage_details?.copay || estimated_cost * 0.2,
      message: 'Insurance verified successfully. You can proceed with booking.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in verify-insurance-before-booking:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      verified: false,
      requires_action: false,
      warning: true,
      message: 'Verification system unavailable. You may proceed with booking.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
