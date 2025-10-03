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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { to, message, media_url, template } = await req.json();

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886';

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const body = new URLSearchParams({
      From: TWILIO_WHATSAPP_NUMBER,
      To: toNumber,
      StatusCallback: `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook`,
    });

    if (template) {
      body.append('ContentSid', template.sid);
      body.append('ContentVariables', JSON.stringify(template.variables));
    } else {
      body.append('Body', message);
    }

    if (media_url) {
      body.append('MediaUrl', media_url);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio error:', errorText);
      throw new Error(`Twilio API error: ${response.status}`);
    }

    const twilioData = await response.json();

    // Log to database
    const { data: storedMessage, error: dbError } = await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: user.id,
        phone_number: to,
        direction: 'outbound',
        status: twilioData.status,
        message_body: message,
        message_type: media_url ? 'media' : 'text',
        media_urls: media_url ? [{ url: media_url }] : null,
        message_sid: twilioData.sid,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // Track delivery status with initial state
    await supabase.from('message_delivery_status').insert({
      message_id: twilioData.sid,
      status: 'queued',
      created_at: new Date().toISOString()
    });

    console.log(`WhatsApp message queued: ${twilioData.sid} to ${to}`);

    return new Response(JSON.stringify({
      success: true,
      message_sid: twilioData.sid,
      message_id: storedMessage?.id,
      status: twilioData.status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});