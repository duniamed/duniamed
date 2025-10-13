// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { 
      user_id, 
      export_type, 
      include_data = [] 
    } = await req.json();

    // Gather data based on export_type
    let payload: any = {};

    switch (export_type) {
      case 'patient_full':
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user_id)
          .single();

        const { data: records } = await supabaseClient
          .from('medical_records')
          .select('*')
          .eq('patient_id', user_id);

        const { data: prescriptions } = await supabaseClient
          .from('prescriptions')
          .select('*')
          .eq('patient_id', user_id);

        payload = { profile, records, prescriptions, type: 'patient_full' };
        break;

      case 'specialist_credentials':
        const { data: specialistData } = await supabaseClient
          .from('specialists')
          .select('*, profiles!inner(*)')
          .eq('user_id', user_id)
          .single();

        payload = { specialist: specialistData, type: 'specialist_credentials' };
        break;

      case 'clinic_data':
        const { data: clinicData } = await supabaseClient
          .from('clinics')
          .select('*')
          .eq('created_by', user_id);

        payload = { clinics: clinicData, type: 'clinic_data' };
        break;

      case 'waitlist_spot':
        const { data: waitlistData } = await supabaseClient
          .from('appointment_waitlist')
          .select('*')
          .eq('patient_id', user_id)
          .eq('status', 'waiting');

        payload = { waitlist: waitlistData, type: 'waitlist_spot' };
        break;
    }

    // Encrypt payload (simple base64 for now, use proper encryption in production)
    const encryptedPayload = btoa(JSON.stringify(payload));

    // Create QR export record
    const { data: qrExport, error } = await supabaseClient
      .from('qr_profile_exports')
      .insert({
        user_id,
        export_type,
        encrypted_payload: { data: encryptedPayload },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Generate QR code URL
    const qrUrl = `${Deno.env.get('SITE_URL')}/import-profile?token=${qrExport.qr_token}`;

    return new Response(
      JSON.stringify({ 
        success: true,
        qr_token: qrExport.qr_token,
        qr_url: qrUrl,
        expires_at: qrExport.expires_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});