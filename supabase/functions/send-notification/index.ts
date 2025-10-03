import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, title, message, data } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user email and preferences
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email, first_name')
      .eq('id', userId)
      .single();

    const { data: prefs } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) throw new Error('User not found');

    // Check if notification type is enabled
    const shouldSend = !prefs || 
      (type.includes('review') && prefs.review_notifications) ||
      (type.includes('complaint') && prefs.complaint_notifications) ||
      (type.includes('insurance') && prefs.insurance_notifications);

    if (!shouldSend) {
      return new Response(
        JSON.stringify({ success: true, message: 'Notification disabled by user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email if enabled
    if (!prefs || prefs.email_enabled) {
      await resend.emails.send({
        from: "DuniaMed <notifications@resend.dev>",
        to: [profile.email],
        subject: title,
        html: `
          <h2>${title}</h2>
          <p>Hi ${profile.first_name || 'there'},</p>
          <p>${message}</p>
          ${data?.link ? `<p><a href="${data.link}">View Details</a></p>` : ''}
          <br>
          <p>Best regards,<br>The DuniaMed Team</p>
        `,
      });
    }

    // TODO: Add SMS via Twilio if prefs.sms_enabled
    // TODO: Add push notifications if prefs.push_enabled

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});