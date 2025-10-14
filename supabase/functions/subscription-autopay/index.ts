// UNLIMITED EDGE FUNCTION CAPACITIES: Subscription Auto-Payment
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
    const { subscription_id } = await req.json();

    console.log(`Processing auto-payment for subscription: ${subscription_id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch subscription details
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .single();

    if (error) throw error;

    // Smart retry logic with exponential backoff
    let attempts = 0;
    const maxAttempts = 3;
    const retryDelays = [0, 3600000, 86400000]; // 0, 1 hour, 24 hours

    while (attempts < maxAttempts) {
      try {
        // Simulate payment processing (would integrate with Stripe)
        const paymentResult = {
          success: true,
          transaction_id: `txn_${Date.now()}`,
          amount: subscription.amount,
          processed_at: new Date().toISOString()
        };

        // Update subscription
        await supabase
          .from('subscriptions')
          .update({
            last_payment_at: new Date().toISOString(),
            next_payment_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          })
          .eq('id', subscription_id);

        return new Response(JSON.stringify({ success: true, payment: paymentResult }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (paymentError) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`Payment attempt ${attempts} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempts]));
        } else {
          throw new Error('Max payment attempts reached');
        }
      }
    }

  } catch (error: any) {
    console.error('Subscription autopay error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
