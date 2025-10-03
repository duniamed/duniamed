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
    const { estimate_id, lock_duration_minutes = 30 } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    // Fetch estimate details
    const { data: estimate, error: estimateError } = await supabase
      .from('cost_estimates')
      .select('*')
      .eq('id', estimate_id)
      .single();

    if (estimateError || !estimate) {
      throw new Error('Cost estimate not found');
    }

    // Check for existing valid locks
    const { data: existingLock } = await supabase
      .from('cost_estimate_locks')
      .select('*')
      .eq('estimate_id', estimate_id)
      .eq('patient_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingLock) {
      console.log(`Existing lock found: ${existingLock.id}`);
      return new Response(
        JSON.stringify({
          success: true,
          lock: existingLock,
          message: 'Price already locked for this estimate'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new lock
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + lock_duration_minutes);

    const { data: lock, error: lockError } = await supabase
      .from('cost_estimate_locks')
      .insert({
        estimate_id,
        patient_id: user.id,
        locked_amount: estimate.estimated_cost,
        currency: estimate.currency || 'USD',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (lockError) throw lockError;

    // Log the lock event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'price_locked',
      resource_type: 'cost_estimate',
      resource_id: estimate_id,
      changes: {
        locked_amount: estimate.estimated_cost,
        expires_at: expiresAt.toISOString(),
        lock_id: lock.id
      }
    });

    console.log(`Created price lock ${lock.id} for estimate ${estimate_id}, expires ${expiresAt.toISOString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        lock,
        locked_amount: estimate.estimated_cost,
        currency: estimate.currency || 'USD',
        expires_at: expiresAt.toISOString(),
        minutes_remaining: lock_duration_minutes,
        message: `Price locked for ${lock_duration_minutes} minutes`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Price lock error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});