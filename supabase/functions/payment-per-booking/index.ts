// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY_LOV') ?? '', {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { appointment_id, specialist_id, amount, currency = 'USD' } = await req.json();

    // Get specialist's Stripe account
    const { data: specialist } = await supabaseClient
      .from('specialists')
      .select('stripe_account_id, user_id')
      .eq('id', specialist_id)
      .single();

    if (!specialist?.stripe_account_id) {
      throw new Error('Specialist Stripe account not connected');
    }

    // Create payment intent with application fee
    const platformFeePercent = 0.20; // 20% platform fee
    const platformFeeAmount = Math.round(amount * platformFeePercent);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency.toLowerCase(),
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: specialist.stripe_account_id,
      },
      metadata: {
        appointment_id,
        specialist_id,
        payment_type: 'per_booking_fee'
      }
    });

    // Update appointment with payment info
    await supabaseClient
      .from('appointments')
      .update({
        payment_type: 'per_booking_fee',
        payment_id: paymentIntent.id,
        fee: amount / 100
      })
      .eq('id', appointment_id);

    return new Response(
      JSON.stringify({ 
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});