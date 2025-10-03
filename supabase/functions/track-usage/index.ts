import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * C16 PRICING - Track Usage
 * Meters feature usage against subscription limits and triggers upgrade prompts
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, feature_key, increment = 1 } = await req.json();

    if (!user_id || !feature_key) {
      return new Response(
        JSON.stringify({ error: 'user_id and feature_key required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Tracking usage: ${feature_key} for user: ${user_id}`);

    // Get user's current subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_tiers(*)')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'No active subscription' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tier = (subscription as any).subscription_tiers;
    const usageLimits = tier.usage_limits || {};
    const currentUsage = (subscription as any).usage_current || {};

    // Check if feature is within limits
    const limit = usageLimits[feature_key];
    const current = currentUsage[feature_key] || 0;

    if (limit !== -1 && current >= limit) {
      console.log(`Usage limit exceeded: ${current}/${limit}`);
      
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'Usage limit exceeded',
          current_usage: current,
          limit: limit,
          upgrade_required: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment usage
    const newUsage = { ...currentUsage, [feature_key]: current + increment };

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ usage_current: newUsage })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Error updating usage:', updateError);
      throw updateError;
    }

    // Send warning at 80% usage
    const percentUsed = limit !== -1 ? ((current + increment) / limit) * 100 : 0;
    if (percentUsed >= 80 && percentUsed < 100) {
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: user_id,
          type: 'usage_warning',
          title: 'Usage Limit Warning',
          message: `You've used ${percentUsed.toFixed(0)}% of your ${feature_key} limit this month`,
          data: {
            feature_key,
            current: current + increment,
            limit
          }
        }
      });
    }

    console.log(`Usage tracked: ${current + increment}/${limit}`);

    return new Response(
      JSON.stringify({
        allowed: true,
        current_usage: current + increment,
        limit: limit,
        percent_used: percentUsed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in track-usage:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
