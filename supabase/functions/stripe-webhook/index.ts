import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_LOV") || "", {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No signature");

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.type) {
      case "customer.created":
        const customer = event.data.object;
        await supabase.from("stripe_customers").upsert({
          stripe_customer_id: customer.id,
          email: customer.email,
          user_id: customer.metadata.user_id,
        });
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object;
        await supabase.from("stripe_subscriptions").upsert({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          user_id: subscription.metadata.user_id,
          status: subscription.status,
          plan_id: subscription.items.data[0].price.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        });
        break;

      case "customer.subscription.deleted":
        const deletedSub = event.data.object;
        await supabase.from("stripe_subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", deletedSub.id);
        break;

      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        await supabase.from("payments").insert({
          stripe_payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: "completed",
          payer_id: paymentIntent.metadata.payer_id,
          payee_id: paymentIntent.metadata.payee_id,
          appointment_id: paymentIntent.metadata.appointment_id,
        });
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});