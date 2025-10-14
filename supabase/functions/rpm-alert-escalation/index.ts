// UNLIMITED EDGE FUNCTION CAPACITIES: RPM Alert Escalation
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
    const { alertId, patientId, severity, metricType, value } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Escalating RPM alert ${alertId} with severity ${severity}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Determine escalation protocol for RPM alerts. Return JSON: { "action": "notify_specialist|emergency_contact|911", "urgency": "immediate|urgent|routine", "message": "" }' },
          { role: 'user', content: `Severity: ${severity}, Metric: ${metricType}, Value: ${value}` }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const escalation = JSON.parse(aiData.choices[0].message.content);

    if (escalation.action === 'notify_specialist') {
      const { data: careTeam } = await supabase.from('care_team_members').select('specialist_id').eq('patient_id', patientId).eq('role', 'primary');
      
      if (careTeam && careTeam.length > 0) {
        await supabase.from('notifications').insert({
          user_id: careTeam[0].specialist_id,
          type: 'rpm_escalation',
          title: `Critical RPM Alert - Patient`,
          message: escalation.message,
          metadata: { alertId, patientId, severity, metricType, value }
        });
      }
    } else if (escalation.action === 'emergency_contact') {
      // Trigger emergency contact notification
      await supabase.from('notifications').insert({
        user_id: patientId,
        type: 'emergency_alert',
        title: 'Emergency Protocol Activated',
        message: escalation.message,
        metadata: { alertId, escalation }
      });
    }

    await supabase.from('rpm_alerts').insert({
      patient_id: patientId,
      alert_type: metricType,
      severity,
      value,
      escalation_action: escalation.action,
      escalated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, escalation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('RPM escalation error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
