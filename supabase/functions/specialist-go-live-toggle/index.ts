// UNLIMITED EDGE FUNCTION CAPACITIES: Go Live Toggle for On-Demand Consultations
// Core Principle: Instant availability control with AI workload management

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { specialistId, goLive, clinicId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get specialist's current status
    const { data: currentStatus } = await supabase
      .from('specialist_live_status')
      .select('*')
      .eq('specialist_id', specialistId)
      .maybeSingle();

    // Calculate fatigue score based on today's sessions
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySessions, error: sessionsError } = await supabase
      .from('appointments')
      .select('id, duration_minutes, completed_at')
      .eq('specialist_id', specialistId)
      .gte('scheduled_at', `${today}T00:00:00Z`)
      .eq('status', 'completed');

    const totalMinutesToday = todaySessions?.reduce((sum, s) => sum + (s.duration_minutes || 30), 0) || 0;
    const fatigueScore = Math.min(totalMinutesToday / 480, 1.0); // 8 hours = 1.0 fatigue

    // AI workload optimization: suggest auto-offline time
    let autoOfflineAt = null;
    if (goLive && fatigueScore < 0.8) {
      // Suggest 2-hour live window with fatigue consideration
      const maxMinutes = Math.floor((0.8 - fatigueScore) * 240); // Max 240 minutes if no fatigue
      autoOfflineAt = new Date(Date.now() + maxMinutes * 60000).toISOString();
    }

    // Update or create live status
    const statusUpdate = {
      specialist_id: specialistId,
      is_live: goLive,
      live_since: goLive ? new Date().toISOString() : null,
      clinic_id: clinicId,
      fatigue_score: fatigueScore,
      auto_offline_at: autoOfflineAt,
      total_sessions_today: todaySessions?.length || 0,
      updated_at: new Date().toISOString()
    };

    let result;
    if (currentStatus) {
      const { data, error } = await supabase
        .from('specialist_live_status')
        .update(statusUpdate)
        .eq('specialist_id', specialistId)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('specialist_live_status')
        .insert(statusUpdate)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    // If going offline, update patient queue
    if (!goLive) {
      await supabase
        .from('patient_queue')
        .update({ status: 'cancelled' })
        .eq('specialist_id', specialistId)
        .eq('status', 'waiting');
    }

    // Get current queue size if clinic
    let queueSize = 0;
    if (clinicId && goLive) {
      const { data: queueData } = await supabase
        .from('patient_queue')
        .select('id', { count: 'exact' })
        .eq('clinic_id', clinicId)
        .eq('status', 'waiting');
      
      queueSize = queueData?.length || 0;
    }

    // Update queue size
    if (goLive) {
      await supabase
        .from('specialist_live_status')
        .update({ current_queue_size: queueSize })
        .eq('specialist_id', specialistId);
    }

    console.log(`Specialist ${specialistId} is now ${goLive ? 'LIVE' : 'OFFLINE'}`);

    return new Response(
      JSON.stringify({
        success: true,
        status: result,
        queueSize,
        fatigueScore,
        autoOfflineAt,
        recommendation: fatigueScore > 0.7 
          ? 'Consider taking a break - high fatigue detected' 
          : 'Good energy levels for consultations'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in specialist-go-live-toggle:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});