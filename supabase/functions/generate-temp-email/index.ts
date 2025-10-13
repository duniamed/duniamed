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

    const { patient_id } = await req.json();

    // Check if patient already has active temp email
    const { data: existing } = await supabaseClient
      .from('temp_prescription_emails')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          temp_email: existing.temp_email,
          qr_code_data: existing.qr_code_data,
          expires_at: existing.expires_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Generate unique temp email
    const randomId = crypto.randomUUID().split('-')[0];
    const tempEmail = `rx-${randomId}@prescriptions.yourplatform.com`;

    // Generate QR code data (token for scanning)
    const qrToken = crypto.randomUUID();
    const qrCodeData = JSON.stringify({
      type: 'prescription_upload',
      patient_id,
      email: tempEmail,
      token: qrToken
    });

    // Insert temp email
    const { data: tempEmailRecord, error } = await supabaseClient
      .from('temp_prescription_emails')
      .insert({
        patient_id,
        temp_email: tempEmail,
        qr_code_data: qrCodeData,
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        temp_email: tempEmailRecord.temp_email,
        qr_code_data: tempEmailRecord.qr_code_data,
        expires_at: tempEmailRecord.expires_at
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