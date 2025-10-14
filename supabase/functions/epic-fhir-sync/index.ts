// UNLIMITED EDGE FUNCTION CAPACITIES: Epic FHIR Integration
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
    const { patientId, epicAccessToken, resourceType } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Syncing ${resourceType} from Epic for patient ${patientId}`);

    const epicResponse = await fetch(`https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/${resourceType}?patient=${patientId}`, {
      headers: { 'Authorization': `Bearer ${epicAccessToken}`, 'Accept': 'application/fhir+json' }
    });

    const fhirData = await epicResponse.json();

    await supabase.from('fhir_resources').insert({
      patient_id: patientId,
      resource_type: resourceType,
      fhir_data: fhirData,
      source: 'epic',
      synced_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, resourcesImported: fhirData.entry?.length || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Epic FHIR sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
