// UNLIMITED EDGE FUNCTION CAPACITIES: Automated Appointment Reminders
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
    const { appointment_id } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: appointment } = await supabase
      .from('appointments')
      .select('*, profiles!patient_id(*), specialists(*)')
      .eq('id', appointment_id)
      .single();

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
            content: `Generate personalized appointment reminder message. Return JSON with:
- sms_message: SMS reminder text (160 chars max)
- email_subject: Email subject line
- email_body: Full email HTML
- push_notification: Push notification text
- optimal_send_times: Array of best times to send (24h, 1h before)
- personalization_tokens: Custom fields to include`
          },
          {
            role: 'user',
            content: JSON.stringify(appointment)
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const reminder = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('appointment_reminders').insert({
      appointment_id,
      message_content: reminder.sms_message,
      channel: 'sms',
      send_at: new Date(new Date(appointment.scheduled_at).getTime() - 24 * 60 * 60 * 1000).toISOString()
    });

    return new Response(JSON.stringify({ success: true, reminder }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Reminder automation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
