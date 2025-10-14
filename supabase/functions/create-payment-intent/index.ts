// UNLIMITED EDGE FUNCTION CAPACITIES: Create Payment Intent with Stripe
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
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
    const { appointmentId, amount, currency = 'USD', hsaFsaEligible = false } = await req.json();

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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    // Get appointment details
    const { data: appointment } = await supabase
      .from('appointments')
      .select('*, profiles!patient_id(email)')
      .eq('id', appointmentId)
      .single();

    // Create or get customer
    const { data: customers } = await stripe.customers.list({
      email: appointment.profiles.email,
      limit: 1
    });

    let customerId: string;
    if (customers.length > 0) {
      customerId = customers[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: appointment.profiles.email,
        metadata: { patient_id: appointment.patient_id }
      });
      customerId = customer.id;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        appointment_id: appointmentId,
        hsa_fsa_eligible: hsaFsaEligible.toString()
      },
      automatic_payment_methods: { enabled: true }
    });

    console.log('Payment intent created:', paymentIntent.id);

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Payment intent error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
