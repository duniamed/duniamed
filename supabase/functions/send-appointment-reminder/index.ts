import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentReminder {
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  patientPhone?: string;
  specialistName: string;
  scheduledAt: string;
  consultationType: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get appointments scheduled for 24 hours from now
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setHours(dayAfterTomorrow.getHours() + 25);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        consultation_type,
        reminder_sent,
        patient_id,
        specialist_id,
        profiles!appointments_patient_id_fkey(email, first_name, last_name, phone, reminder_preferences),
        specialists!inner(user_id, profiles!specialists_user_id_fkey(first_name, last_name))
      `)
      .gte('scheduled_at', tomorrow.toISOString())
      .lte('scheduled_at', dayAfterTomorrow.toISOString())
      .eq('reminder_sent', false)
      .eq('status', 'confirmed');

    if (error) throw error;

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    let sentCount = 0;

    for (const appt of appointments || []) {
      const patient = (appt as any).profiles;
      const specialist = (appt as any).specialists?.profiles;
      const preferences = patient?.reminder_preferences || { email: true, sms: false };

      // Send email reminder
      if (preferences.email) {
        try {
          // Call send-email edge function
          const { error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              to: [patient.email],
              subject: 'Appointment Reminder - Tomorrow',
              html: `
                <h2>Appointment Reminder</h2>
                <p>Dear ${patient.first_name} ${patient.last_name},</p>
                <p>This is a reminder about your upcoming appointment:</p>
                <ul>
                  <li><strong>Doctor:</strong> Dr. ${specialist.first_name} ${specialist.last_name}</li>
                  <li><strong>Type:</strong> ${appt.consultation_type}</li>
                  <li><strong>Date & Time:</strong> ${new Date(appt.scheduled_at).toLocaleString()}</li>
                </ul>
                <p>Please make sure to be available at the scheduled time.</p>
                <p>Best regards,<br>DUNIAMED Team</p>
              `,
            }
          });
          if (emailError) {
            console.error(`Failed to send email to ${patient.email}:`, emailError);
          } else {
            console.log(`Email reminder sent to ${patient.email}`);
          }
        } catch (emailError) {
          console.error(`Failed to send email to ${patient.email}:`, emailError);
        }
      }

      // Send SMS reminder
      if (preferences.sms && patient.phone && twilioAccountSid && twilioAuthToken) {
        try {
          const message = `DUNIAMED Reminder: You have an appointment with Dr. ${specialist.first_name} ${specialist.last_name} tomorrow at ${new Date(appt.scheduled_at).toLocaleTimeString()}. Type: ${appt.consultation_type}`;
          
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: patient.phone,
                From: twilioPhone!,
                Body: message,
              }),
            }
          );

          if (response.ok) {
            console.log(`SMS reminder sent to ${patient.phone}`);
          }
        } catch (smsError) {
          console.error(`Failed to send SMS to ${patient.phone}:`, smsError);
        }
      }

      // Mark reminder as sent
      await supabase
        .from('appointments')
        .update({ reminder_sent: true, reminder_sent_at: new Date().toISOString() })
        .eq('id', appt.id);

      sentCount++;
    }

    return new Response(
      JSON.stringify({ success: true, remindersSent: sentCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending reminders:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});