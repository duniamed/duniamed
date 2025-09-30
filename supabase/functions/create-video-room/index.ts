import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoRoomRequest {
  appointmentId: string;
  userName: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY not configured. Please add it in Supabase Dashboard > Project Settings > Edge Functions');
    }

    const { appointmentId, userName }: VideoRoomRequest = await req.json();

    console.log('Creating video room for appointment:', appointmentId);

    // Create Daily.co room
    const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `appointment-${appointmentId}`,
        privacy: 'private',
        properties: {
          max_participants: 2,
          enable_screenshare: true,
          enable_chat: true,
          exp: Math.round(Date.now() / 1000) + 3600, // 1 hour
        },
      }),
    });

    const roomData = await roomResponse.json();

    if (!roomResponse.ok) {
      throw new Error(roomData.error || 'Failed to create video room');
    }

    // Create meeting token
    const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: roomData.name,
          user_name: userName,
        },
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error || 'Failed to create meeting token');
    }

    console.log('Video room created:', roomData.name);

    return new Response(
      JSON.stringify({
        roomUrl: roomData.url,
        token: tokenData.token,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating video room:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
