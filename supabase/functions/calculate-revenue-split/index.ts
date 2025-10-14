// UNLIMITED EDGE FUNCTION CAPACITIES: Automated Revenue Split for Virtual Clinics
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { appointmentId, paymentId, totalAmount } = await req.json();

    console.log(`Calculating revenue split for appointment ${appointmentId}`);

    // Get appointment and clinic details
    const { data: appointment } = await supabase
      .from('appointments')
      .select('specialist_id, clinic_id')
      .eq('id', appointmentId)
      .single();

    if (!appointment?.clinic_id) {
      // Solo practitioner - no split needed
      return new Response(JSON.stringify({
        success: true,
        splits: [{
          recipient_id: appointment.specialist_id,
          recipient_type: 'specialist',
          amount: totalAmount,
          percentage: 100
        }]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get clinic revenue split configuration
    const { data: clinic } = await supabase
      .from('clinics')
      .select('revenue_split_config')
      .eq('id', appointment.clinic_id)
      .single();

    const splitConfig = clinic?.revenue_split_config || {
      platform_fee_percentage: 5,
      clinic_percentage: 20,
      specialist_percentage: 75
    };

    // Calculate splits
    const platformFee = totalAmount * (splitConfig.platform_fee_percentage / 100);
    const clinicShare = totalAmount * (splitConfig.clinic_percentage / 100);
    const specialistShare = totalAmount * (splitConfig.specialist_percentage / 100);

    const splits = [
      {
        recipient_id: 'platform',
        recipient_type: 'platform',
        amount: platformFee,
        percentage: splitConfig.platform_fee_percentage
      },
      {
        recipient_id: appointment.clinic_id,
        recipient_type: 'clinic',
        amount: clinicShare,
        percentage: splitConfig.clinic_percentage
      },
      {
        recipient_id: appointment.specialist_id,
        recipient_type: 'specialist',
        amount: specialistShare,
        percentage: splitConfig.specialist_percentage
      }
    ];

    // Record splits in database
    for (const split of splits) {
      if (split.recipient_id !== 'platform') {
        await supabase.from('revenue_splits').insert({
          payment_id: paymentId,
          appointment_id: appointmentId,
          recipient_id: split.recipient_id,
          recipient_type: split.recipient_type,
          amount: split.amount,
          percentage: split.percentage,
          status: 'pending'
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      splits
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Revenue split error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
