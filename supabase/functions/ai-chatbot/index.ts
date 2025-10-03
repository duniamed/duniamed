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
    const { sessionId, message, action = 'chat' } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization');
    let userId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Get or create session
    let session;
    if (sessionId) {
      const { data } = await supabase
        .from('chatbot_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      session = data;
    }

    if (!session) {
      const newSessionId = crypto.randomUUID();
      const { data } = await supabase
        .from('chatbot_sessions')
        .insert({
          user_id: userId,
          session_id: newSessionId,
          messages: []
        })
        .select()
        .single();
      session = data;
    }

    if (action === 'escalate') {
      const { error } = await supabase
        .from('chatbot_sessions')
        .update({
          escalated_to_human: true,
          escalated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Escalated to human agent. Someone will assist you shortly.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add user message
    const messages = [...(session.messages || []), {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }];

    // Use Grok for chatbot response
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROK_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [{
          role: 'system',
          content: `You are a helpful medical platform support assistant. Help users with:
- Booking appointments
- Finding specialists
- Understanding insurance
- Technical issues
- General questions

If the issue is complex or the user is frustrated, suggest escalation to a human agent.
Keep responses concise, empathetic, and action-oriented.`
        }, ...messages.map(m => ({ role: m.role, content: m.content }))],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!grokResponse.ok) {
      throw new Error('Grok API request failed');
    }

    const grokData = await grokResponse.json();
    const assistantMessage = grokData.choices[0].message.content;

    // Add assistant response
    messages.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString()
    });

    // Check if should suggest escalation
    const shouldEscalate = assistantMessage.toLowerCase().includes('escalate') ||
                          assistantMessage.toLowerCase().includes('human agent');

    // Update session
    const { error } = await supabase
      .from('chatbot_sessions')
      .update({ messages })
      .eq('id', session.id);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        sessionId: session.session_id,
        message: assistantMessage,
        suggestEscalation: shouldEscalate
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Chatbot error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
