// UNLIMITED EDGE FUNCTION CAPACITIES: Virtual Health Assistant with NLP
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
    const { userId, message, conversationHistory, patientContext } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Virtual assistant processing:', { userId, messageLength: message.length });

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
            content: 'You are a virtual health assistant. Provide empathetic, accurate health guidance. Return JSON: { "response": "", "intent": "appointment|medication|symptom|emergency|general", "confidence": 0-1, "suggestedActions": [], "requiresHumanFollowup": boolean, "urgencyLevel": "low|medium|high|critical", "extractedEntities": {}, "sentiment": "", "nextBestAction": "" }'
          },
          {
            role: 'user',
            content: JSON.stringify({ message, conversationHistory, patientContext, profile })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const assistantResponse = JSON.parse(aiData.choices[0].message.content);

    await supabase
      .from('assistant_conversations')
      .insert({
        user_id: userId,
        message: message,
        response: assistantResponse.response,
        intent: assistantResponse.intent,
        urgency_level: assistantResponse.urgencyLevel,
        requires_followup: assistantResponse.requiresHumanFollowup
      });

    return new Response(JSON.stringify({ success: true, assistantResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Virtual health assistant error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
