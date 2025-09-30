import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@14.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentIntentRequest {
  appointmentId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { appointmentId }: PaymentIntentRequest = await req.json();

    console.log('Creating payment intent for appointment:', appointmentId);

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*, specialists(user_id, stripe_account_id)')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.patient_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // Calculate platform fee (10%)
    const amount = Math.round(appointment.fee * 100); // Convert to cents
    const platformFee = Math.round(amount * 0.10);
    const specialistPayout = amount - platformFee;

    // Create payment intent with Stripe Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: appointment.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        appointmentId: appointment.id,
        patientId: user.id,
      },
      // If specialist has Stripe Connect account, use application fee
      ...(appointment.specialists?.stripe_account_id && {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: appointment.specialists.stripe_account_id,
        },
      }),
    });

    // Create payment record
    await supabase.from('payments').insert({
      appointment_id: appointmentId,
      payer_id: user.id,
      payee_id: appointment.specialist_id,
      amount: appointment.fee,
      currency: appointment.currency,
      platform_fee: platformFee / 100,
      specialist_payout: specialistPayout / 100,
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
    });

    console.log('Payment intent created:', paymentIntent.id);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        amount: appointment.fee,
        currency: appointment.currency,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
