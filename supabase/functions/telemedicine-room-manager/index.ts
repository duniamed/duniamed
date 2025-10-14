// UNLIMITED EDGE FUNCTION CAPACITIES: Telemedicine Room Manager
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
    const { action, appointmentId, roomConfig } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Telemedicine room action: ${action} for appointment ${appointmentId}`);

    const dailyApiKey = Deno.env.get('DAILY_API_KEY');
    
    if (action === 'create_room') {
      const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${dailyApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `appointment-${appointmentId}`,
          properties: {
            enable_screenshare: true,
            enable_chat: true,
            enable_recording: roomConfig?.recordSession || false,
            max_participants: 5,
            exp: Math.floor(Date.now() / 1000) + (3600 * 4) // 4 hours
          }
        })
      });

      const roomData = await roomResponse.json();
      
      await supabase.from('appointments').update({
        video_room_id: roomData.name,
        video_room_url: roomData.url
      }).eq('id', appointmentId);

      return new Response(JSON.stringify({ success: true, room: roomData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (action === 'get_token') {
      const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${dailyApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: { room_name: `appointment-${appointmentId}`, is_owner: roomConfig?.isHost || false }
        })
      });

      const tokenData = await tokenResponse.json();
      
      return new Response(JSON.stringify({ success: true, token: tokenData.token }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error('Telemedicine room error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
