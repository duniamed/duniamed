import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * C4 RESILIENCE - Multi-Channel Notification with Automatic Failover
 * 
 * WORKFLOW:
 * 1. Receive notification request with user_id and message
 * 2. Load user's notification channels (email, SMS, WhatsApp)
 * 3. Attempt delivery via primary channel
 * 4. If primary fails, automatically failover to secondary channels
 * 5. Log all delivery attempts for observability
 * 6. Return delivery status with channel used
 * 
 * INTEGRATIONS:
 * - Resend for email
 * - Twilio for SMS
 * - Twilio WhatsApp Business for WhatsApp
 * - All credentials stored in Supabase secrets
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  user_id: string;
  subject: string;
  message: string;
  notification_type: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, subject, message, notification_type, metadata }: NotificationRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Load user's notification channels
    const { data: channels, error: channelsError } = await supabase
      .from('notification_channels')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_verified', true)
      .order('is_primary', { ascending: false });

    if (channelsError) throw channelsError;

    if (!channels || channels.length === 0) {
      console.warn('No verified notification channels for user:', user_id);
      return new Response(
        JSON.stringify({ success: false, error: 'No notification channels configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let delivered = false;
    const deliveryLog = [];

    // Try each channel in order until one succeeds
    for (const channel of channels) {
      try {
        console.log(`Attempting delivery via ${channel.channel_type} to ${channel.channel_value}`);

        switch (channel.channel_type) {
          case 'email':
            await supabase.functions.invoke('send-email', {
              body: {
                to: channel.channel_value,
                subject,
                html: message
              }
            });
            break;

          case 'sms':
            await supabase.functions.invoke('send-sms', {
              body: {
                to: channel.channel_value,
                message: `${subject}\n\n${message}`
              }
            });
            break;

          case 'whatsapp':
            await supabase.functions.invoke('send-sms', {
              body: {
                to: `whatsapp:${channel.channel_value}`,
                message: `${subject}\n\n${message}`
              }
            });
            break;
        }

        deliveryLog.push({
          channel: channel.channel_type,
          status: 'success',
          attempted_at: new Date().toISOString()
        });

        delivered = true;
        break; // Success - stop trying other channels
      } catch (error: any) {
        console.error(`Failed to deliver via ${channel.channel_type}:`, error.message);
        deliveryLog.push({
          channel: channel.channel_type,
          status: 'failed',
          error: error.message,
          attempted_at: new Date().toISOString()
        });
      }
    }

    // Log delivery attempt
    await supabase.from('notification_delivery').insert({
      user_id,
      notification_type,
      delivery_status: delivered ? 'delivered' : 'failed',
      channels_attempted: deliveryLog,
      metadata
    });

    if (!delivered) {
      throw new Error('All notification channels failed');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        delivered_via: deliveryLog[deliveryLog.length - 1].channel,
        delivery_log: deliveryLog
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Multi-channel notification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
