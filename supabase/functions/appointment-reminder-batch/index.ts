import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { hours_before = 24, batch_size = 100 } = await req.json();

    console.log('Processing reminder batch:', { hours_before, batch_size });

    // Find appointments needing reminders
    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() + hours_before);

    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:profiles!appointments_patient_id_fkey(id, email, first_name, phone),
        specialist:specialists!inner(user:profiles!specialists_user_id_fkey(first_name, last_name)),
        clinic:clinics(name)
      `)
      .gte('scheduled_at', new Date().toISOString())
      .lte('scheduled_at', targetTime.toISOString())
      .eq('status', 'confirmed')
      .or('reminder_sent.is.null,reminder_sent.eq.false')
      .limit(batch_size);

    if (fetchError) throw fetchError;

    console.log(`Found ${appointments?.length || 0} appointments needing reminders`);

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[]
    };

    for (const appointment of appointments || []) {
      try {
        // Get patient preferences
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('channels, reminder_hours_before')
          .eq('user_id', appointment.patient_id)
          .single();

        const channels = prefs?.channels || ['email', 'sms'];
        const customHours = prefs?.reminder_hours_before;

        // Skip if custom timing doesn't match
        if (customHours && customHours !== hours_before) {
          results.skipped++;
          continue;
        }

        // Calculate time until appointment
        const hoursUntil = Math.round(
          (new Date(appointment.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60)
        );

        const messageContent = `Reminder: You have an appointment with Dr. ${appointment.specialist.user.first_name} ${appointment.specialist.user.last_name} at ${appointment.clinic?.name || 'the clinic'} in ${hoursUntil} hours. 
        
Scheduled: ${new Date(appointment.scheduled_at).toLocaleString()}
Type: ${appointment.consultation_type}
${appointment.modality === 'telehealth' ? 'Video link will be sent 15 minutes before.' : `Location: ${appointment.clinic?.name}`}

To reschedule or cancel, please contact us or visit your patient portal.`;

        // Send via selected channels
        const sendPromises = [];

        if (channels.includes('email') && appointment.patient.email) {
          sendPromises.push(
            supabase.functions.invoke('send-email', {
              body: {
                to: appointment.patient.email,
                subject: `Appointment Reminder - ${new Date(appointment.scheduled_at).toLocaleDateString()}`,
                html: messageContent.replace(/\n/g, '<br>')
              }
            })
          );
        }

        if (channels.includes('sms') && appointment.patient.phone) {
          sendPromises.push(
            supabase.functions.invoke('send-sms', {
              body: {
                to: appointment.patient.phone,
                message: messageContent
              }
            })
          );
        }

        if (channels.includes('whatsapp') && appointment.patient.phone) {
          sendPromises.push(
            supabase.functions.invoke('send-whatsapp-message', {
              body: {
                to: appointment.patient.phone,
                message: messageContent
              }
            })
          );
        }

        // Wait for all sends
        const sendResults = await Promise.allSettled(sendPromises);
        
        const allSucceeded = sendResults.every(r => r.status === 'fulfilled');

        // Update reminder status
        await supabase
          .from('appointments')
          .update({
            reminder_sent: allSucceeded,
            reminder_sent_at: allSucceeded ? new Date().toISOString() : null
          })
          .eq('id', appointment.id);

        // Create reminder record
        await supabase.from('appointment_reminders').insert({
          appointment_id: appointment.id,
          reminder_type: `${hours_before}h_before`,
          channel: channels.join(','),
          recipient_contact: appointment.patient.email || appointment.patient.phone,
          message_content: messageContent,
          send_at: new Date().toISOString(),
          sent_at: allSucceeded ? new Date().toISOString() : null,
          status: allSucceeded ? 'sent' : 'failed'
        });

        if (allSucceeded) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({
            appointment_id: appointment.id,
            errors: sendResults.filter(r => r.status === 'rejected').map(r => (r as any).reason)
          });
        }

      } catch (error) {
        results.failed++;
        results.errors.push({
          appointment_id: appointment.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Failed to send reminder for appointment ${appointment.id}:`, error);
      }
    }

    console.log('Batch processing complete:', results);

    return new Response(JSON.stringify({
      success: true,
      results,
      processed: appointments?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in appointment-reminder-batch:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
