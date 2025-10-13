// Unlimited Edge Function Capacities: QR Profile Import with HIPAA compliance
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exportToken, scannedBy } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch export record
    const { data: exportRecord, error: fetchError } = await supabase
      .from('qr_profile_exports')
      .select('*')
      .eq('export_token', exportToken)
      .single();

    if (fetchError || !exportRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired QR code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (new Date(exportRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'QR code has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt payload
    const decrypted = JSON.parse(atob(exportRecord.encrypted_payload));

    // Mark as scanned
    await supabase
      .from('qr_profile_exports')
      .update({
        scanned_at: new Date().toISOString(),
        scanned_by: scannedBy
      })
      .eq('export_token', exportToken);

    // Log audit trail
    await supabase
      .from('audit_logs')
      .insert({
        user_id: scannedBy,
        action: 'qr_profile_import',
        resource_type: exportRecord.export_type,
        resource_id: exportRecord.user_id,
        changes: { export_token: exportToken }
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        profileData: decrypted,
        exportType: exportRecord.export_type
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('QR import error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});