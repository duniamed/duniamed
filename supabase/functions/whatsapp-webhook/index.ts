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
    const body = await req.json();
    console.log('WhatsApp webhook:', JSON.stringify(body, null, 2));
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle status updates (delivery receipts)
    if (body.MessageStatus) {
      const messageSid = body.MessageSid || body.SmsSid;
      const status = body.MessageStatus; // queued, sent, delivered, read, failed
      
      await supabase.from('message_delivery_status').upsert({
        message_id: messageSid,
        status,
        error_code: body.ErrorCode,
        error_message: body.ErrorMessage,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'message_id'
      });

      console.log(`Status update: ${messageSid} -> ${status}`);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle incoming messages
    const messageSid = body.MessageSid || body.SmsSid;
    const from = body.From || body.WaId;
    const profileName = body.ProfileName;
    const waId = from.replace('whatsapp:', '');
    const messageBody = body.Body;
    const messageType = body.MessageType || 'text';
    
    const mediaUrls = [];
    const numMedia = parseInt(body.NumMedia || '0');
    for (let i = 0; i < numMedia; i++) {
      mediaUrls.push({
        url: body[`MediaUrl${i}`],
        content_type: body[`MediaContentType${i}`]
      });
    }

    // Find user by phone number
    const phoneNumber = from.replace('whatsapp:', '');
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phoneNumber)
      .single();

    if (profile) {
      // Log incoming message with extended metadata
      await supabase.from('whatsapp_messages').insert({
        user_id: profile.id,
        phone_number: phoneNumber,
        message_sid: messageSid,
        direction: 'inbound',
        status: 'received',
        message_body: messageBody,
        message_type: messageType,
        media_urls: mediaUrls,
        profile_name: profileName,
        wa_id: waId,
        webhook_data: body
      });

      // Track in delivery status
      await supabase.from('message_delivery_status').insert({
        message_id: messageSid,
        status: 'received',
        profile_name: profileName,
        wa_id: waId
      });

      // Auto-respond for appointment reminders
      if (messageBody?.toLowerCase().includes('confirm')) {
        const response = await fetch(
          'https://api.twilio.com/2010-04-01/Accounts/' + 
          Deno.env.get('TWILIO_ACCOUNT_SID') + '/Messages.json',
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(
                Deno.env.get('TWILIO_ACCOUNT_SID') + ':' + 
                Deno.env.get('TWILIO_AUTH_TOKEN')
              ),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: 'whatsapp:' + Deno.env.get('TWILIO_PHONE_NUMBER'),
              To: from,
              Body: '✅ Your appointment is confirmed! We look forward to seeing you.',
              StatusCallback: `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook`
            })
          }
        );

        if (!response.ok) {
          console.error('Twilio send failed');
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
