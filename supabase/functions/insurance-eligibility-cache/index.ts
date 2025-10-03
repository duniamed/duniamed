import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

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

    const { patient_id, payer_id, member_id, force_refresh } = await req.json();

    console.log('Insurance eligibility check:', { patient_id, payer_id, force_refresh });

    // Check cache first unless force refresh
    if (!force_refresh) {
      const { data: cached } = await supabase
        .from('insurance_eligibility_cache')
        .select('*')
        .eq('patient_id', patient_id)
        .eq('payer_id', payer_id)
        .eq('member_id', member_id)
        .gt('expires_at', new Date().toISOString())
        .order('cached_at', { ascending: false })
        .limit(1)
        .single();

      if (cached) {
        console.log('Cache hit:', cached.id);
        return new Response(JSON.stringify({
          success: true,
          source: 'cache',
          cached_at: cached.cached_at,
          data: cached.eligibility_data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Cache miss - call eligibility API
    console.log('Cache miss, calling eligibility API');
    
    const { data: eligibilityData, error: apiError } = await supabase.functions.invoke(
      'check-eligibility',
      {
        body: {
          patient_id,
          payer_id,
          member_id,
          service_type: 'medical_care'
        }
      }
    );

    if (apiError) throw apiError;

    // Store in cache
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

    const { data: cacheEntry, error: cacheError } = await supabase
      .from('insurance_eligibility_cache')
      .insert({
        patient_id,
        payer_id,
        member_id,
        eligibility_data: eligibilityData,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (cacheError) {
      console.error('Cache storage failed:', cacheError);
      // Continue anyway - data is valid
    }

    // Create verification record if eligible
    if (eligibilityData.is_eligible) {
      await supabase.from('insurance_verifications').insert({
        patient_id,
        payer_id,
        member_id,
        status: 'verified',
        coverage_details: eligibilityData.coverage_details,
        expires_at: eligibilityData.coverage_end_date
      });
    }

    console.log('Eligibility cached:', cacheEntry?.id);

    return new Response(JSON.stringify({
      success: true,
      source: 'api',
      cached_at: new Date().toISOString(),
      cache_id: cacheEntry?.id,
      data: eligibilityData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in insurance-eligibility-cache:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
