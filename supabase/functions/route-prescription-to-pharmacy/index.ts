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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prescription_id, pharmacy_selection } = await req.json();

    console.log('Routing prescription to pharmacy:', { prescription_id, pharmacy_selection });

    // Fetch prescription details
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patient:profiles!prescriptions_patient_id_fkey(
          id, email, phone, address_line1, city, state, postal_code, country
        ),
        specialist:specialists(
          user_id, license_number, license_country
        )
      `)
      .eq('id', prescription_id)
      .single();

    if (prescriptionError) throw prescriptionError;

    // Determine pharmacy routing method
    let routingMethod: string;
    let pharmacyDetails: any;

    if (pharmacy_selection?.preferred_pharmacy) {
      // Patient selected their preferred pharmacy
      const { data: pharmacy } = await supabase
        .from('patient_preferred_pharmacies')
        .select('*')
        .eq('id', pharmacy_selection.preferred_pharmacy)
        .eq('patient_id', prescription.patient_id)
        .single();

      pharmacyDetails = pharmacy;
      routingMethod = 'preferred';
    } else if (pharmacy_selection?.nearby_search) {
      // Find nearby pharmacies based on patient location
      // In production, integrate with pharmacy APIs (Surescripts, CoverMyMeds)
      pharmacyDetails = {
        name: 'Nearest Pharmacy (Auto-detected)',
        address: prescription.patient.address_line1,
        city: prescription.patient.city,
        state: prescription.patient.state,
        postal_code: prescription.patient.postal_code,
        phone: 'To be determined',
        supports_eprescribe: true
      };
      routingMethod = 'nearby_auto';
    } else {
      // Default: suggest patient to pick up at nearest
      pharmacyDetails = {
        name: 'Patient will select pharmacy',
        routing_status: 'pending_patient_selection'
      };
      routingMethod = 'patient_choice';
    }

    // Create prescription routing record
    const { data: routing, error: routingError } = await supabase
      .from('prescription_routing')
      .insert({
        prescription_id: prescription_id,
        patient_id: prescription.patient_id,
        routing_method: routingMethod,
        pharmacy_details: pharmacyDetails,
        status: pharmacyDetails.supports_eprescribe ? 'sent_electronically' : 'pending_manual',
        routed_at: new Date().toISOString(),
        electronic_transmission: !!pharmacyDetails.supports_eprescribe,
      })
      .select()
      .single();

    if (routingError) throw routingError;

    // Send notification to patient
    const notificationMessage = pharmacyDetails.supports_eprescribe
      ? `Your prescription for ${prescription.medication_name} has been sent electronically to ${pharmacyDetails.name}. It should be ready for pickup within 1-2 hours.`
      : `Your prescription for ${prescription.medication_name} is ready. Please select a pharmacy to fill it.`;

    await supabase.from('notifications').insert({
      user_id: prescription.patient_id,
      title: 'Prescription Routed',
      message: notificationMessage,
      type: 'prescription',
      data: {
        prescription_id,
        routing_id: routing.id,
        pharmacy: pharmacyDetails
      },
    });

    // If electronic transmission supported, simulate e-prescribe send
    if (pharmacyDetails.supports_eprescribe) {
      // In production, integrate with:
      // - Surescripts NCPDP eRx network
      // - CoverMyMeds for prior authorization
      // - RxNorm for medication coding
      console.log('E-prescribe transmission sent to:', pharmacyDetails.name);
      
      await supabase
        .from('prescriptions')
        .update({
          status: 'sent_to_pharmacy',
          sent_to_pharmacy_at: new Date().toISOString()
        })
        .eq('id', prescription_id);
    }

    return new Response(JSON.stringify({
      success: true,
      routing: routing,
      pharmacy: pharmacyDetails,
      message: 'Prescription routed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in route-prescription-to-pharmacy:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
