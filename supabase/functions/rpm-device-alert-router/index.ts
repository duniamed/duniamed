import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { device_id, patient_id, metric_type, value, threshold_config } = await req.json();

    console.log('RPM alert received:', { device_id, patient_id, metric_type, value });

    // Determine alert severity based on thresholds
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let actionRequired = false;
    let notificationChannels: string[] = ['in_app'];

    if (threshold_config) {
      if (value >= threshold_config.critical_high || value <= threshold_config.critical_low) {
        severity = 'critical';
        actionRequired = true;
        notificationChannels = ['in_app', 'sms', 'email', 'push'];
      } else if (value >= threshold_config.high || value <= threshold_config.low) {
        severity = 'high';
        actionRequired = true;
        notificationChannels = ['in_app', 'email', 'push'];
      } else if (value >= threshold_config.warning_high || value <= threshold_config.warning_low) {
        severity = 'medium';
        notificationChannels = ['in_app', 'push'];
      }
    }

    // Store alert in database
    const { data: alert, error: alertError } = await supabase
      .from('rpm_alerts')
      .insert({
        device_id,
        patient_id,
        metric_type,
        value,
        severity,
        threshold_config,
        status: actionRequired ? 'action_required' : 'informational'
      })
      .select()
      .single();

    if (alertError) throw alertError;

    // Get patient's care team
    const { data: careTeam } = await supabase
      .from('patient_care_plans')
      .select(`
        specialist_id,
        team_id,
        care_team_members (
          specialist_id
        )
      `)
      .eq('patient_id', patient_id)
      .eq('is_active', true)
      .limit(1)
      .single();

    // Route alert to appropriate specialists
    const recipientIds: string[] = [];
    
    if (careTeam) {
      // Add primary specialist
      if (careTeam.specialist_id) {
        recipientIds.push(careTeam.specialist_id);
      }
      
      // Add care team members if critical
      if (severity === 'critical' && careTeam.care_team_members) {
        for (const member of careTeam.care_team_members) {
          if (member.specialist_id && !recipientIds.includes(member.specialist_id)) {
            recipientIds.push(member.specialist_id);
          }
        }
      }
    }

    // Get specialist user IDs
    const { data: specialists } = await supabase
      .from('specialists')
      .select('id, user_id')
      .in('id', recipientIds);

    const notificationPromises = [];

    // Send notifications to care team
    for (const specialist of specialists || []) {
      const message = severity === 'critical'
        ? `🚨 CRITICAL: Patient RPM alert - ${metric_type}: ${value}`
        : `⚠️ ${severity.toUpperCase()}: Patient RPM alert - ${metric_type}: ${value}`;

      notificationPromises.push(
        supabase.functions.invoke('send-multi-channel-notification', {
          body: {
            user_id: specialist.user_id,
            title: `RPM Alert - ${severity.toUpperCase()}`,
            message,
            channels: notificationChannels,
            data: {
              alert_id: alert.id,
              patient_id,
              device_id,
              metric_type,
              value,
              severity
            }
          }
        })
      );
    }

    // Notify patient
    notificationPromises.push(
      supabase.functions.invoke('send-multi-channel-notification', {
        body: {
          user_id: patient_id,
          title: 'Health Monitoring Alert',
          message: severity === 'critical'
            ? `Your ${metric_type} reading is outside normal range. Your care team has been notified.`
            : `Your ${metric_type} reading has changed. Continue monitoring as advised.`,
          channels: ['in_app', 'push'],
          data: {
            alert_id: alert.id,
            metric_type,
            value
          }
        }
      })
    );

    await Promise.allSettled(notificationPromises);

    // Auto-escalate if critical and no response in 15 minutes
    if (severity === 'critical') {
      await supabase.functions.invoke('escalate-rpm-alert', {
        body: {
          alert_id: alert.id,
          delay_minutes: 15
        }
      });
    }

    console.log('Alert routed successfully:', {
      alert_id: alert.id,
      severity,
      recipients_count: recipientIds.length,
      channels: notificationChannels
    });

    return new Response(JSON.stringify({
      success: true,
      alert_id: alert.id,
      severity,
      action_required: actionRequired,
      recipients_notified: recipientIds.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in rpm-device-alert-router:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
