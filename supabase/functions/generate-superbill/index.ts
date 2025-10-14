// UNLIMITED EDGE FUNCTION CAPACITIES: Superbill Generation
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
    const { appointment_id } = await req.json();

    console.log(`Generating superbill for appointment: ${appointment_id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch appointment with all related data
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:profiles!appointments_patient_id_fkey(*),
        specialist:specialists(*, profiles:profiles!specialists_user_id_fkey(*)),
        soap_notes(diagnosis_codes, procedure_codes)
      `)
      .eq('id', appointment_id)
      .single();

    if (error) throw error;

    // Generate superbill
    const superbill = {
      superbill_id: `SB-${Date.now()}`,
      date_of_service: appointment.scheduled_at,
      patient: {
        name: `${appointment.patient.first_name} ${appointment.patient.last_name}`,
        dob: appointment.patient.date_of_birth,
        address: appointment.patient.address_line1,
        insurance_id: appointment.patient.insurance_member_id
      },
      provider: {
        name: `${appointment.specialist.profiles.first_name} ${appointment.specialist.profiles.last_name}`,
        npi: appointment.specialist.npi_number,
        tax_id: appointment.specialist.tax_id,
        license: appointment.specialist.license_number
      },
      diagnosis_codes: appointment.soap_notes?.[0]?.diagnosis_codes || [],
      procedure_codes: appointment.soap_notes?.[0]?.procedure_codes || [],
      charges: [
        {
          code: '99213',
          description: 'Office Visit - Established Patient',
          amount: appointment.fee,
          units: 1
        }
      ],
      total_charges: appointment.fee,
      amount_paid: appointment.fee,
      balance_due: 0,
      generated_at: new Date().toISOString()
    };

    return new Response(JSON.stringify({ success: true, superbill }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Superbill generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
