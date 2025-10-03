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
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_PHONE_NUMBER'); // Format: whatsapp:+1234567890

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      throw new Error('Twilio credentials not configured');
    }

    const { to, message, media_url } = await req.json();

    // Validate phone number format
    if (!to || !to.startsWith('+')) {
      throw new Error('Invalid phone number format. Must start with +');
    }

    console.log('Sending WhatsApp message:', { 
      to, 
      message_length: message?.length,
      has_media: !!media_url 
    });

    // Build the request body
    const body = new URLSearchParams({
      From: `whatsapp:${twilioWhatsAppNumber}`,
      To: `whatsapp:${to}`,
      Body: message || '',
    });

    if (media_url) {
      body.append('MediaUrl', media_url);
    }

    // Send via Twilio WhatsApp API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const authString = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Twilio API error:', errorText);
      throw new Error(`Twilio API error: ${twilioResponse.status} - ${errorText}`);
    }

    const twilioData = await twilioResponse.json();

    console.log('WhatsApp message sent successfully:', {
      message_sid: twilioData.sid,
      status: twilioData.status,
      to: twilioData.to
    });

    return new Response(JSON.stringify({
      success: true,
      message_sid: twilioData.sid,
      status: twilioData.status,
      date_sent: twilioData.date_sent,
      to: twilioData.to,
      from: twilioData.from
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send WhatsApp message' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
