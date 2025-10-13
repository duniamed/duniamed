// UNLIMITED EDGE FUNCTION CAPACITIES: Process Booking Payments with Stripe
// Core Principle: Seamless payment processing with revenue splits

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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
    const { 
      appointmentId, 
      amount, 
      currency = 'USD', 
      paymentMethod,
      hsaFsaEligible = false,
      installmentPlan = null
    } = await req.json();

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY_LOV');
    if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured');

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get appointment details
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('*, specialists!inner(user_id), profiles!patient_id(email)')
      .eq('id', appointmentId)
      .single();

    if (aptError) throw aptError;

    // Create or get Stripe customer
    const customerEmail = appointment.profiles?.email;
    let customerId: string;

    const { data: customers } = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });

    if (customers.length > 0) {
      customerId = customers[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          patient_id: appointment.patient_id
        }
      });
      customerId = customer.id;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        specialist_id: appointment.specialist_id,
        hsa_fsa_eligible: hsaFsaEligible.toString()
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Create booking transaction record
    const { data: transaction, error: transError } = await supabase
      .from('booking_transactions')
      .insert({
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        specialist_id: appointment.specialist_id,
        clinic_id: appointment.clinic_id,
        amount: amount,
        currency: currency,
        transaction_type: 'booking_fee',
        payment_method: paymentMethod || 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
        hsa_fsa_eligible: hsaFsaEligible,
        installment_plan_id: installmentPlan
      })
      .select()
      .single();

    if (transError) throw transError;

    // Calculate revenue splits if clinic booking
    if (appointment.clinic_id) {
      const { data: splitRule } = await supabase
        .from('revenue_split_rules')
        .select('*')
        .eq('clinic_id', appointment.clinic_id)
        .eq('specialist_id', appointment.specialist_id)
        .eq('is_active', true)
        .maybeSingle();

      if (splitRule) {
        await supabase.from('revenue_splits').insert({
          booking_transaction_id: transaction.id,
          rule_id: splitRule.id,
          specialist_id: appointment.specialist_id,
          clinic_id: appointment.clinic_id,
          specialist_amount: amount * (splitRule.specialist_share / 100),
          clinic_amount: amount * (splitRule.clinic_share / 100),
          platform_amount: amount * (splitRule.platform_share / 100),
          payout_status: 'pending'
        });
      }
    }

    console.log('Payment intent created:', paymentIntent.id);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        transactionId: transaction.id,
        amount,
        currency
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-booking-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});