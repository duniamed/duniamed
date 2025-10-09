import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { messages, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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

    console.log('Chat stream request:', messages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a helpful healthcare platform support assistant for Duniamed. You help users with:

**Common Issues:**
- Account and login problems
- Booking and scheduling appointments
- Insurance verification questions
- Payment and billing inquiries
- Technical troubleshooting
- Profile and settings help
- Finding specialists and clinics

**Guidelines:**
1. Be empathetic and professional
2. Provide clear, step-by-step instructions
3. If medical advice is requested, redirect to book an appointment with a specialist
4. Never ask for passwords or sensitive personal information

**Duniamed Features:**
- Telemedicine consultations
- Multi-specialty healthcare network
- Insurance verification
- Medical records management
- Prescription management
- Appointment scheduling

Keep responses concise (under 150 words) unless detailed instructions are needed.`
          },
          ...messages
        ],
        stream: true,
        tools: [
          {
            type: 'function',
            function: {
              name: 'search_specialists',
              description: 'Search for healthcare specialists by specialty, location, or name',
              parameters: {
                type: 'object',
                properties: {
                  specialty: { type: 'string' },
                  location: { type: 'string' }
                }
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'check_appointment_status',
              description: 'Check the status of a user\'s appointments',
              parameters: {
                type: 'object',
                properties: {
                  appointment_id: { type: 'string' }
                }
              }
            }
          }
        ]
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Save conversation in background
    if (userId && conversationId) {
      const allMessages = [...messages];
      supabase
        .from('conversations')
        .update({ 
          messages: allMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .then(({ error }) => {
          if (error) console.error('Error updating conversation:', error);
        });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
    });

  } catch (error) {
    console.error('Error in chat-stream:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
