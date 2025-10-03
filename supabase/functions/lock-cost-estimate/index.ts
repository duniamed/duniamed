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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { estimate_id, lock_duration_hours = 24 } = await req.json();

    if (!estimate_id) {
      throw new Error('estimate_id is required');
    }

    // Get the estimate
    const { data: estimate, error: fetchError } = await supabase
      .from('cost_estimates')
      .select('*')
      .eq('id', estimate_id)
      .eq('patient_id', user.id)
      .single();

    if (fetchError || !estimate) {
      throw new Error('Estimate not found or access denied');
    }

    // Check if already locked
    if (estimate.is_locked && estimate.lock_expires_at) {
      const expiresAt = new Date(estimate.lock_expires_at);
      if (expiresAt > new Date()) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Price already locked',
          locked_until: estimate.lock_expires_at
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Lock the price
    const lockExpiresAt = new Date();
    lockExpiresAt.setHours(lockExpiresAt.getHours() + lock_duration_hours);

    const { data: lockedEstimate, error: updateError } = await supabase
      .from('cost_estimates')
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        locked_by: user.id,
        lock_expires_at: lockExpiresAt.toISOString()
      })
      .eq('id', estimate_id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log('Price locked:', {
      estimate_id,
      user_id: user.id,
      expires_at: lockExpiresAt
    });

    return new Response(JSON.stringify({
      success: true,
      estimate: lockedEstimate,
      locked_until: lockExpiresAt.toISOString(),
      message: `Price locked for ${lock_duration_hours} hours`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in lock-cost-estimate:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});