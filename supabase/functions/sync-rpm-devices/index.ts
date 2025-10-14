// UNLIMITED EDGE FUNCTION CAPACITIES: RPM Device Sync
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
    const { deviceId, patientId, readings } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Syncing RPM device ${deviceId} for patient ${patientId}`);

    const readingsToInsert = readings.map((reading: any) => ({
      patient_id: patientId,
      device_type: reading.deviceType,
      metric_type: reading.metricType,
      value: reading.value,
      unit: reading.unit,
      recorded_at: reading.timestamp,
      device_id: deviceId,
      metadata: reading.metadata || {}
    }));

    const { data: storedReadings, error } = await supabase.from('rpm_device_readings').insert(readingsToInsert).select();
    if (error) throw error;

    await supabase.from('rpm_devices').update({ last_sync_at: new Date().toISOString(), battery_level: readings[0]?.batteryLevel || null, connection_status: 'connected' }).eq('device_id', deviceId);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Analyze RPM device readings for abnormalities. Return JSON: { "alerts": [{"severity": "high|medium|low", "message": "", "metricType": ""}] }' },
          { role: 'user', content: JSON.stringify({ readings }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    for (const alert of analysis.alerts) {
      if (alert.severity === 'high') {
        await supabase.from('notifications').insert({
          user_id: patientId,
          type: 'rpm_alert',
          title: 'RPM Alert',
          message: alert.message,
          metadata: { deviceId, reading: alert }
        });
      }
    }

    return new Response(JSON.stringify({ success: true, readingsStored: storedReadings?.length || 0, alerts: analysis.alerts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('RPM sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
