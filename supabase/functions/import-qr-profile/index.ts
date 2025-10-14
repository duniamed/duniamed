// UNLIMITED EDGE FUNCTION CAPACITIES: Import Profile from Encrypted QR Code
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

    const { transferToken } = await req.json();

    console.log(`Importing QR profile with token ${transferToken}`);

    // Get QR profile
    const { data: qrProfile, error: profileError } = await supabase
      .from('qr_profiles')
      .select('*')
      .eq('transfer_token', transferToken)
      .single();

    if (profileError || !qrProfile) {
      return new Response(JSON.stringify({ error: 'Invalid or expired QR code' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check expiration
    if (new Date(qrProfile.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'QR code has expired' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrypt data
    const encryptedData = Uint8Array.from(atob(qrProfile.encrypted_data), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(qrProfile.encryption_iv), c => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
      'jwk',
      qrProfile.encryption_key_jwk,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    const profileData = JSON.parse(decoder.decode(decryptedData));

    // Import profile data based on type
    const importResults: any = { imported: [] };

    if (profileData.profile) {
      // Update or create profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          ...profileData.profile,
          id: user.id,
          updated_at: new Date().toISOString()
        });

      if (!error) importResults.imported.push('profile');
    }

    if (profileData.medical_history && qrProfile.profile_type === 'patient') {
      // Import medical history
      for (const record of profileData.medical_history) {
        await supabase.from('appointments').insert({
          ...record,
          patient_id: user.id,
          imported_from_qr: true
        });
      }
      importResults.imported.push('medical_history');
    }

    if (profileData.credentials && qrProfile.profile_type === 'specialist') {
      // Import specialist credentials
      const { error } = await supabase
        .from('specialists')
        .upsert({
          ...profileData.credentials,
          user_id: user.id
        });

      if (!error) importResults.imported.push('credentials');
    }

    // Mark QR as used
    await supabase
      .from('qr_profiles')
      .update({ 
        used_at: new Date().toISOString(),
        imported_by: user.id
      })
      .eq('id', qrProfile.id);

    // Log transfer
    await supabase.from('profile_transfers').insert({
      from_user_id: qrProfile.user_id,
      to_user_id: user.id,
      profile_type: qrProfile.profile_type,
      transfer_method: 'qr_code',
      imported_data: importResults.imported
    });

    return new Response(JSON.stringify({
      success: true,
      imported: importResults.imported,
      profile_type: qrProfile.profile_type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('QR profile import error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
