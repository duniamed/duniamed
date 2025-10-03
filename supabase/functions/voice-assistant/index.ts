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
    const { action, sessionType, agentId = 'default' } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    if (action === 'start') {
      // Get ElevenLabs signed URL
      const elevenLabsResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || ''
          }
        }
      );

      if (!elevenLabsResponse.ok) {
        throw new Error('Failed to get ElevenLabs signed URL');
      }

      const elevenLabsData = await elevenLabsResponse.json();

      // Create voice session
      const { data: session, error } = await supabase
        .from('voice_sessions')
        .insert({
          user_id: user.id,
          session_type: sessionType,
          conversation_id: elevenLabsData.conversation_id
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          sessionId: session.id,
          signedUrl: elevenLabsData.signed_url,
          conversationId: elevenLabsData.conversation_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'end') {
      const { sessionId, transcript, durationSeconds } = await req.json();

      const { error } = await supabase
        .from('voice_sessions')
        .update({
          transcript: transcript,
          duration_seconds: durationSeconds,
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: any) {
    console.error('Voice assistant error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
