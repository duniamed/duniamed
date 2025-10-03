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
    const { payerId, memberId, serviceCode } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    // Check cache first
    const { data: cached } = await supabase
      .from('eligibility_checks')
      .select('*')
      .eq('patient_id', user.id)
      .eq('payer_id', payerId)
      .eq('member_id', memberId)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      return new Response(
        JSON.stringify({ ...cached, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Real-time eligibility check (simulated - integrate with Change Healthcare/Availity)
    const eligibilityResult = {
      is_eligible: true,
      coverage_details: {
        planName: 'Premium Health Plan',
        groupNumber: 'GRP123456',
        effectiveDate: '2024-01-01'
      },
      copay_amount: 25.00,
      deductible_remaining: 500.00,
      out_of_pocket_max: 5000.00
    };

    // Cache result for 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data: check, error } = await supabase
      .from('eligibility_checks')
      .insert({
        patient_id: user.id,
        payer_id: payerId,
        member_id: memberId,
        check_date: new Date().toISOString().split('T')[0],
        ...eligibilityResult,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ ...check, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Eligibility check error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
