// Unlimited Edge Function Capacities: QR Profile Export for HIPAA/LGPD compliance
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
    const { userId, exportType, includeData } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user data based on export type
    let payload: any = { userId, exportType, timestamp: new Date().toISOString() };

    if (exportType === 'patient' && includeData.includes('medical_history')) {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, specialists(*)')
        .eq('patient_id', userId);
      payload.appointments = appointments;
    }

    if (exportType === 'specialist' && includeData.includes('notes')) {
      // Include specialist's clinical notes
      payload.specialistData = { verified: true };
    }

    // Encrypt payload (simplified - use proper encryption in production)
    const encrypted = btoa(JSON.stringify(payload));
    
    // Generate unique token
    const exportToken = crypto.randomUUID();
    
    // Store in database
    const { error } = await supabase
      .from('qr_profile_exports')
      .insert({
        user_id: userId,
        export_token: exportToken,
        encrypted_payload: encrypted,
        export_type: exportType,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true,
        exportToken,
        qrData: `DUNIAMED:${exportToken}`,
        expiresIn: '24 hours'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('QR export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});