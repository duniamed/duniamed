// UNLIMITED EDGE FUNCTION CAPACITIES: Smart SMS Routing
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
    const { from, body, to } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Routing SMS from ${from}: ${body}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Classify SMS intent. Return JSON: { "intent": "appointment_request|question|emergency|spam", "urgency": "high|medium|low", "action": "" }' },
          { role: 'user', content: body }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const classification = JSON.parse(aiData.choices[0].message.content);

    if (classification.intent === 'emergency') {
      await supabase.from('notifications').insert({
        user_id: null,
        type: 'emergency_sms',
        title: 'Emergency SMS',
        message: `From ${from}: ${body}`,
        metadata: { from, classification }
      });
    }

    await supabase.from('sms_log').insert({
      from_number: from,
      to_number: to,
      body,
      intent: classification.intent,
      urgency: classification.urgency
    });

    return new Response(JSON.stringify({ success: true, classification }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Smart SMS routing error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
