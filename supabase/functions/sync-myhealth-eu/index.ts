// UNLIMITED EDGE FUNCTION CAPACITIES: MyHealth@EU Cross-Border Data Sync
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

    const { action, patientId, countryCode } = await req.json();

    console.log(`MyHealth@EU sync: ${action} for patient ${patientId} in ${countryCode}`);

    if (action === 'fetch') {
      // Fetch patient data from MyHealth@EU
      // In production, integrate with eHDSI (eHealth Digital Service Infrastructure)
      
      // Simulated fetch from cross-border system
      const ehdsData = {
        patient_summary: {
          id: patientId,
          country_of_origin: countryCode,
          allergies: ['Penicillin'],
          medications: ['Aspirin 100mg daily'],
          conditions: ['Hypertension'],
          vaccinations: ['COVID-19', 'Influenza 2024']
        },
        last_updated: new Date().toISOString()
      };

      // Store in local database
      await supabase.from('ehds_patient_summaries').upsert({
        patient_id: patientId,
        country_code: countryCode,
        summary_data: ehdsData.patient_summary,
        last_synced_at: new Date().toISOString(),
        consent_granted: true
      });

      return new Response(JSON.stringify({
        success: true,
        data: ehdsData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'push') {
      // Push patient data to MyHealth@EU
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();

      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, soap_notes(*), prescriptions(*)')
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: false })
        .limit(10);

      // Create EHDS-compliant patient summary
      const patientSummary = {
        identification: {
          patient_id: patientId,
          name: `${profile.first_name} ${profile.last_name}`,
          date_of_birth: profile.date_of_birth,
          country: profile.country || 'EU'
        },
        clinical_summary: {
          allergies: [], // Extract from appointments
          current_medications: [], // Extract from prescriptions
          recent_encounters: appointments?.map(apt => ({
            date: apt.scheduled_at,
            type: apt.consultation_type,
            provider: apt.specialist_id
          }))
        },
        consent: {
          cross_border_sharing: true,
          effective_date: new Date().toISOString()
        }
      };

      // In production, push to eHDSI National Contact Point
      console.log('Pushing to MyHealth@EU:', patientSummary);

      // Log sync
      await supabase.from('ehds_sync_logs').insert({
        patient_id: patientId,
        action: 'push',
        target_country: countryCode,
        status: 'success',
        records_synced: appointments?.length || 0
      });

      return new Response(JSON.stringify({
        success: true,
        synced_records: appointments?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('MyHealth@EU sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
