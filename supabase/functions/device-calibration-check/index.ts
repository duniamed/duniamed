// UNLIMITED EDGE FUNCTION CAPACITIES: Device Calibration Check
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
    const { deviceId } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Checking calibration for device ${deviceId}`);

    const { data: device } = await supabase.from('rpm_devices').select('*').eq('device_id', deviceId).single();
    if (!device) throw new Error('Device not found');

    const { data: recentReadings } = await supabase
      .from('rpm_device_readings')
      .select('*')
      .eq('device_id', deviceId)
      .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false })
      .limit(100);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Analyze device calibration based on readings. Return JSON: { "needs_calibration": boolean, "confidence": 0-1, "issues_detected": [], "recommendation": "" }' },
          { role: 'user', content: JSON.stringify({ device, recentReadings }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const calibrationCheck = JSON.parse(aiData.choices[0].message.content);

    if (calibrationCheck.needs_calibration) {
      await supabase.from('notifications').insert({
        user_id: device.patient_id,
        type: 'device_maintenance',
        title: 'Device Calibration Required',
        message: calibrationCheck.recommendation,
        metadata: { deviceId, calibrationCheck }
      });
    }

    return new Response(JSON.stringify({ success: true, calibrationCheck }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Device calibration check error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
