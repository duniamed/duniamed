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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { qr_token, scanned_by } = await req.json();

    // Get QR export
    const { data: qrExport, error: qrError } = await supabaseClient
      .from('qr_profile_exports')
      .select('*')
      .eq('qr_token', qr_token)
      .single();

    if (qrError || !qrExport) {
      throw new Error('Invalid or expired QR code');
    }

    // Check if expired
    if (new Date(qrExport.expires_at) < new Date()) {
      throw new Error('QR code has expired');
    }

    // Decrypt payload
    const decryptedPayload = JSON.parse(atob(qrExport.encrypted_payload.data));

    // Mark as scanned
    await supabaseClient
      .from('qr_profile_exports')
      .update({
        scanned_at: new Date().toISOString(),
        scanned_by
      })
      .eq('id', qrExport.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        data: decryptedPayload,
        export_type: qrExport.export_type
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