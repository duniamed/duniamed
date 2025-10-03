import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Support chatbot request:', messages.length, 'messages');

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
            content: `You are a helpful healthcare platform support assistant. You help users with:

**Common Issues:**
- Account and login problems
- Booking and scheduling appointments
- Insurance verification questions
- Payment and billing inquiries
- Technical troubleshooting
- Profile and settings help

**Guidelines:**
1. Be empathetic and professional
2. Provide clear, step-by-step instructions
3. Escalate to human agent if issue is complex or requires account access
4. Never ask for passwords or sensitive personal information
5. If medical advice is requested, redirect to book an appointment with a specialist

**Escalation Triggers:**
- User expresses frustration or anger
- Account access or payment issues
- Medical emergencies (direct to emergency services)
- Complex technical problems
- Privacy or security concerns

When you need to escalate, respond with: "I understand this requires immediate human assistance. Let me connect you with a support specialist who can help resolve this."

Keep responses concise (under 150 words) unless detailed instructions are needed.`
          },
          ...messages
        ],
        stream: true
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
        JSON.stringify({ error: 'Service temporarily unavailable. Connecting you to a human agent...' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
    });

  } catch (error) {
    console.error('Error in support-chatbot:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
