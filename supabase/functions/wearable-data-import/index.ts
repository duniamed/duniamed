// UNLIMITED EDGE FUNCTION CAPACITIES: Wearable Data Import
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
    const { provider, patientId, accessToken, dataType } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Importing ${dataType} from ${provider} for patient ${patientId}`);

    let wearableData: any[] = [];

    if (provider === 'fitbit') {
      const response = await fetch(`https://api.fitbit.com/1/user/-/${dataType}/date/today/1d.json`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      wearableData = data.activities || data.sleep || [];
    } else if (provider === 'apple_health') {
      wearableData = await req.json().appleHealthData || [];
    } else if (provider === 'google_fit') {
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ aggregateBy: [{ dataTypeName: dataType }], bucketByTime: { durationMillis: 86400000 } })
      });
      const data = await response.json();
      wearableData = data.bucket || [];
    }

    const { error } = await supabase.from('rpm_device_readings').insert(
      wearableData.map((d: any) => ({
        patient_id: patientId,
        device_type: provider,
        metric_type: dataType,
        value: d.value || d.steps || d.heartRate,
        unit: d.unit || 'count',
        recorded_at: d.timestamp || new Date().toISOString(),
        metadata: { raw_data: d }
      }))
    );

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, imported: wearableData.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Wearable import error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
