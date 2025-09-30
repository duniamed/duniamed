import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoTokenRequest {
  appointmentId: string;
  roomName?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { appointmentId, roomName }: VideoTokenRequest = await req.json();

    console.log('Creating video room for appointment:', appointmentId);

    // Verify user has access to this appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*, specialists(user_id)')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found');
    }

    const isPatient = appointment.patient_id === user.id;
    const isSpecialist = appointment.specialists?.user_id === user.id;

    if (!isPatient && !isSpecialist) {
      throw new Error('Unauthorized to access this appointment');
    }

    // Create Daily.co room
    const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName || `appointment-${appointmentId}`,
        privacy: 'private',
        properties: {
          max_participants: 2,
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: false,
          enable_prejoin_ui: false,
          exp: Math.round(Date.now() / 1000) + 3600, // 1 hour expiry
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
          user_name: isPatient ? 'Patient' : 'Doctor',
          is_owner: isSpecialist,
        },
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error || 'Failed to create meeting token');
    }

    // Update appointment with video room info
    await supabase
      .from('appointments')
      .update({
        video_room_url: roomData.url,
        video_room_id: roomData.id,
      })
      .eq('id', appointmentId);

    console.log('Video room created successfully:', roomData.name);

    return new Response(
      JSON.stringify({
        roomUrl: roomData.url,
        roomName: roomData.name,
        token: tokenData.token,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating video token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
