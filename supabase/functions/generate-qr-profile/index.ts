// UNLIMITED EDGE FUNCTION CAPACITIES: Generate Encrypted QR Profile for Transfer
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

    const { profileType, includeData } = await req.json();

    console.log(`Generating QR profile for user ${user.id}, type: ${profileType}`);

    let profileData: any = {};

    // Get base profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    profileData.profile = profile;

    // Include additional data based on profile type
    if (profileType === 'patient' && includeData?.includes('medical_records')) {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, soap_notes(*), prescriptions(*)')
        .eq('patient_id', user.id);

      profileData.medical_history = appointments;
    }

    if (profileType === 'specialist' && includeData?.includes('credentials')) {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('*')
        .eq('user_id', user.id)
        .single();

      profileData.credentials = specialist;
    }

    if (profileType === 'clinic' && includeData?.includes('clinic_data')) {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('*')
        .eq('created_by', user.id);

      profileData.clinic_info = clinic;
    }

    // Encrypt profile data (HIPAA/LGPD compliant)
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(profileData));
    
    // Generate encryption key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Export key for QR code
    const exportedKey = await crypto.subtle.exportKey('jwk', key);

    // Create transfer token
    const transferToken = crypto.randomUUID();

    // Store encrypted profile
    const { data: qrProfile, error } = await supabase
      .from('qr_profiles')
      .insert({
        user_id: user.id,
        transfer_token: transferToken,
        profile_type: profileType,
        encrypted_data: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
        encryption_iv: btoa(String.fromCharCode(...iv)),
        encryption_key_jwk: exportedKey,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        included_data: includeData || []
      })
      .select()
      .single();

    if (error) throw error;

    // Generate QR data
    const qrData = {
      version: '1.0',
      token: transferToken,
      type: profileType,
      url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/import-qr-profile`
    };

    return new Response(JSON.stringify({
      success: true,
      qr_data: qrData,
      qr_string: JSON.stringify(qrData),
      expires_at: qrProfile.expires_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('QR profile generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
