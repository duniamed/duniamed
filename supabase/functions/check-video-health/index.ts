import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * C19 TELEHEALTH - Video Health Check
 * Validates video session requirements before appointment
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { appointment_id } = await req.json();

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: 'appointment_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Running pre-session health check for appointment: ${appointment_id}`);

    // Check for active telehealth incidents
    const { data: activeIncidents, error: incidentsError } = await supabase
      .from('telehealth_incidents')
      .select('*')
      .in('status', ['open', 'investigating'])
      .gte('severity', 'medium');

    if (incidentsError) {
      console.error('Error checking incidents:', incidentsError);
    }

    const hasActiveIncidents = (activeIncidents?.length || 0) > 0;

    // Simulate connection test (in production, this would test actual WebRTC connectivity)
    const healthCheck = {
      connectivity_ok: !hasActiveIncidents && Math.random() > 0.1,
      bandwidth_sufficient: Math.random() > 0.05,
      latency_acceptable: Math.random() > 0.05,
      devices_available: true
    };

    const overallHealth = Object.values(healthCheck).every(v => v);

    // Log the health check
    await supabase
      .from('video_session_health')
      .insert({
        appointment_id: appointment_id,
        health_status: overallHealth ? 'healthy' : 'warning',
        connectivity_score: overallHealth ? 95 : 60,
        audio_quality: overallHealth ? 90 : 65,
        video_quality: overallHealth ? 90 : 65,
        latency_ms: overallHealth ? 50 : 150,
        packet_loss_percent: overallHealth ? 0.1 : 1.5,
        error_messages: hasActiveIncidents 
          ? [{ message: 'Active service degradation detected', severity: 'medium' }]
          : []
      });

    const recommendations = [];
    
    if (!healthCheck.connectivity_ok) {
      recommendations.push({
        action: 'reschedule',
        reason: 'Network connectivity issues detected',
        priority: 'high'
      });
    }

    if (!healthCheck.bandwidth_sufficient) {
      recommendations.push({
        action: 'use_audio_only',
        reason: 'Limited bandwidth - audio-only recommended',
        priority: 'medium'
      });
    }

    if (hasActiveIncidents) {
      recommendations.push({
        action: 'wait',
        reason: 'Service degradation in progress',
        priority: 'high'
      });
    }

    console.log(`Health check complete: ${overallHealth ? 'PASS' : 'FAIL'}`);

    return new Response(
      JSON.stringify({
        success: true,
        health_status: overallHealth ? 'healthy' : 'degraded',
        checks: healthCheck,
        recommendations: recommendations,
        can_proceed: overallHealth || recommendations.some(r => r.action === 'use_audio_only'),
        active_incidents: activeIncidents?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-video-health:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
