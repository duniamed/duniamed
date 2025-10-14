// UNLIMITED EDGE FUNCTION CAPACITIES: Blockchain Medical Records
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
    const { patientId, recordType, recordData } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Creating blockchain record for patient ${patientId}`);

    const recordHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify(recordData))
    );
    
    const hashArray = Array.from(new Uint8Array(recordHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const blockchainEntry = {
      patient_id: patientId,
      record_type: recordType,
      record_hash: hashHex,
      timestamp: new Date().toISOString(),
      previous_hash: null,
      metadata: recordData
    };

    await supabase.from('blockchain_medical_records').insert(blockchainEntry);

    return new Response(JSON.stringify({ success: true, hash: hashHex }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Blockchain record error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
