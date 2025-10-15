// UNLIMITED EDGE FUNCTION CAPACITIES: Telemedicine Quality Monitor
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
    const { appointmentId, videoMetrics, audioMetrics } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Monitoring telemedicine quality:', { appointmentId });

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Monitor telemedicine session quality. Return JSON: { "overallQuality": 0-100, "videoQuality": 0-100, "audioQuality": 0-100, "connectionStability": 0-100, "latency": 0, "packetLoss": 0, "issues": [], "recommendations": [], "requiresIntervention": false, "complianceScore": 0-100 }'
          },
          {
            role: 'user',
            content: JSON.stringify({ appointmentId, videoMetrics, audioMetrics })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const quality = JSON.parse(aiData.choices[0].message.content);

    await supabase
      .from('telemedicine_quality_logs')
      .insert({
        appointment_id: appointmentId,
        quality_score: quality.overallQuality,
        video_quality: quality.videoQuality,
        audio_quality: quality.audioQuality,
        connection_stability: quality.connectionStability,
        issues: quality.issues,
        recommendations: quality.recommendations
      });

    return new Response(JSON.stringify({ success: true, quality }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Telemedicine quality monitor error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
