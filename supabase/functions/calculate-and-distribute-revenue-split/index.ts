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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { payment_id, trigger_type = 'manual' } = await req.json();

    console.log('Calculating revenue split for payment:', payment_id);

    // Fetch payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        appointment:appointments(
          id,
          clinic_id,
          specialist_id,
          consultation_type,
          duration_minutes,
          specialist:specialists(
            user_id,
            specialty
          )
        )
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError) throw paymentError;

    if (payment.status !== 'completed') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment not completed yet'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch revenue split configuration
    const { data: splitConfig, error: splitError } = await supabase
      .from('revenue_splits')
      .select('*')
      .eq('clinic_id', payment.appointment.clinic_id)
      .eq('specialist_id', payment.appointment.specialist_id)
      .eq('is_active', true)
      .single();

    if (splitError && splitError.code !== 'PGRST116') throw splitError;

    // Default split if no configuration exists: 70% specialist, 30% clinic
    const specialist_percentage = splitConfig?.specialist_percentage || 70;
    const clinic_percentage = splitConfig?.clinic_percentage || 30;

    // Calculate amounts
    const gross_amount = parseFloat(payment.amount.toString());
    const platform_fee = gross_amount * 0.025; // 2.5% platform fee
    const net_amount = gross_amount - platform_fee;

    const specialist_amount = net_amount * (specialist_percentage / 100);
    const clinic_amount = net_amount * (clinic_percentage / 100);

    // Create distribution record
    const { data: distribution, error: distributionError } = await supabase
      .from('revenue_distributions')
      .insert({
        payment_id: payment_id,
        appointment_id: payment.appointment.id,
        clinic_id: payment.appointment.clinic_id,
        specialist_id: payment.appointment.specialist_id,
        gross_amount: gross_amount,
        platform_fee: platform_fee,
        net_amount: net_amount,
        specialist_percentage: specialist_percentage,
        clinic_percentage: clinic_percentage,
        specialist_amount: specialist_amount,
        clinic_amount: clinic_amount,
        currency: payment.currency,
        split_config_used: splitConfig?.id || null,
        calculated_at: new Date().toISOString(),
        status: 'calculated',
        notes: `Auto-calculated via ${trigger_type} trigger`
      })
      .select()
      .single();

    if (distributionError) throw distributionError;

    // Create payout records (will be processed by separate payout job)
    const payouts = [];

    // Specialist payout
    const { data: specialistPayout } = await supabase
      .from('specialist_payouts')
      .insert({
        specialist_id: payment.appointment.specialist_id,
        distribution_id: distribution.id,
        amount: specialist_amount,
        currency: payment.currency,
        status: 'pending',
        scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        payment_method: 'bank_transfer', // Would come from specialist preferences
      })
      .select()
      .single();

    payouts.push(specialistPayout);

    // Clinic payout
    const { data: clinicPayout } = await supabase
      .from('clinic_payouts')
      .insert({
        clinic_id: payment.appointment.clinic_id,
        distribution_id: distribution.id,
        amount: clinic_amount,
        currency: payment.currency,
        status: 'pending',
        scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: 'bank_transfer',
      })
      .select()
      .single();

    payouts.push(clinicPayout);

    // Update distribution status
    await supabase
      .from('revenue_distributions')
      .update({ status: 'payouts_scheduled' })
      .eq('id', distribution.id);

    // Send notifications
    await supabase.from('notifications').insert([
      {
        user_id: payment.appointment.specialist.user_id,
        title: 'Revenue Share Calculated',
        message: `Your share of $${specialist_amount.toFixed(2)} from appointment #${payment.appointment.id} has been calculated and will be paid out in 7 days.`,
        type: 'financial',
        data: { distribution_id: distribution.id, payout_id: specialistPayout.id }
      },
      // Clinic notification would go to clinic admin
    ]);

    console.log('Revenue split calculated:', {
      gross: gross_amount,
      platform_fee: platform_fee,
      specialist: specialist_amount,
      clinic: clinic_amount
    });

    return new Response(JSON.stringify({
      success: true,
      distribution: distribution,
      payouts: payouts,
      breakdown: {
        gross_amount: gross_amount,
        platform_fee: platform_fee,
        net_amount: net_amount,
        specialist_amount: specialist_amount,
        clinic_amount: clinic_amount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in calculate-and-distribute-revenue-split:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
