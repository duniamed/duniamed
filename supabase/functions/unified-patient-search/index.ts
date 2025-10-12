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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, searchType } = await req.json();

    console.log(`Searching for patient: ${query} (type: ${searchType})`);

    let patients = [];

    // Search by identifier (CPF, SSN, NHS, etc.)
    if (searchType === 'identifier') {
      const { data: identifiers } = await supabase
        .from('patient_identifiers')
        .select(`
          patient_id,
          identifier_type,
          identifier_value,
          verified,
          profiles:patient_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            avatar_url
          )
        `)
        .ilike('identifier_value', `%${query}%`)
        .limit(10);

      patients = identifiers?.map(id => ({
        ...id.profiles,
        identifier: {
          type: id.identifier_type,
          value: id.identifier_value,
          verified: id.verified
        }
      })) || [];
    } 
    // Search by name or email
    else {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, date_of_birth, avatar_url, role')
        .eq('role', 'patient')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      patients = profiles || [];
    }

    // For each patient, fetch their medical summary
    const enrichedPatients = await Promise.all(
      patients.map(async (patient: any) => {
        // Get medical summary
        const { data: summary } = await supabase
          .from('patient_medical_summary')
          .select('*')
          .eq('patient_id', patient.id)
          .single();

        // Get appointment count
        const { count: appointmentCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patient.id);

        // Get active prescriptions count
        const { count: prescriptionCount } = await supabase
          .from('prescriptions')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patient.id)
          .eq('status', 'active');

        // Get insurance status (if available)
        const { data: insurance } = await supabase
          .from('insurance_verification')
          .select('*')
          .eq('patient_id', patient.id)
          .order('verified_at', { ascending: false })
          .limit(1)
          .single();

        // Get last appointment
        const { data: lastAppointment } = await supabase
          .from('appointments')
          .select('scheduled_at, chief_complaint')
          .eq('patient_id', patient.id)
          .order('scheduled_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...patient,
          medicalSummary: summary || {
            current_medications: [],
            allergies: [],
            chronic_conditions: [],
            total_appointments: appointmentCount || 0,
            has_active_prescriptions: (prescriptionCount || 0) > 0
          },
          stats: {
            totalAppointments: appointmentCount || 0,
            activePrescriptions: prescriptionCount || 0,
            lastVisit: lastAppointment?.scheduled_at || null,
            lastComplaint: lastAppointment?.chief_complaint || null
          },
          insurance: insurance ? {
            provider: insurance.insurance_provider,
            status: insurance.coverage_status,
            verified: insurance.is_verified
          } : null
        };
      })
    );

    return new Response(JSON.stringify({
      success: true,
      patients: enrichedPatients
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Patient search error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Search failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});