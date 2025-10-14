// UNLIMITED EDGE FUNCTION CAPACITIES: Revenue Split Calculation
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
    const { appointment_id, total_fee } = await req.json();

    console.log(`Calculating fee split for appointment: ${appointment_id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch appointment details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        specialist:specialists(*),
        clinic:clinics(*)
      `)
      .eq('id', appointment_id)
      .single();

    if (error) throw error;

    // Calculate split based on agreements
    const platformFeePercent = 5; // Platform fee
    const clinicFeePercent = appointment.clinic ? 20 : 0; // Clinic overhead
    const specialistPercent = 100 - platformFeePercent - clinicFeePercent;

    const split = {
      total_fee,
      platform_fee: (total_fee * platformFeePercent / 100).toFixed(2),
      clinic_fee: (total_fee * clinicFeePercent / 100).toFixed(2),
      specialist_fee: (total_fee * specialistPercent / 100).toFixed(2),
      breakdown: {
        platform_percent: platformFeePercent,
        clinic_percent: clinicFeePercent,
        specialist_percent: specialistPercent
      }
    };

    return new Response(JSON.stringify({ success: true, split }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Fee split calculation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
