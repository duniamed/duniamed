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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { specialist_id, newly_available_slots, trigger_source } = await req.json();

    console.log('Checking waitlist for specialist:', specialist_id, 'Trigger:', trigger_source);

    // Find all waiting patients for this specialist
    const { data: waitlistEntries, error: waitlistError } = await supabase
      .from('appointment_waitlist')
      .select(`
        *,
        patient:profiles!appointment_waitlist_patient_id_fkey(
          id, email, phone, first_name, last_name, preferred_language
        ),
        specialist:specialists(
          user_id,
          user:profiles!specialists_user_id_fkey(
            first_name, last_name
          )
        )
      `)
      .eq('specialist_id', specialist_id)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true }); // FIFO

    if (waitlistError) throw waitlistError;

    if (!waitlistEntries || waitlistEntries.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        notified_count: 0,
        message: 'No waiting patients found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Match waitlist entries with newly available slots
    const notifications = [];
    const matches = [];

    for (const entry of waitlistEntries) {
      // Check if preferred date/time matches available slots
      const matchingSlot = newly_available_slots?.find((slot: any) => {
        if (!entry.preferred_date) return true; // No preference = any slot works
        
        const slotDate = new Date(slot.start_time).toISOString().split('T')[0];
        const preferredDate = entry.preferred_date;
        
        if (slotDate !== preferredDate) return false;
        
        // Check time slot preference if specified
        if (entry.preferred_time_slot) {
          const slotHour = new Date(slot.start_time).getHours();
          const timeSlot = entry.preferred_time_slot; // 'morning', 'afternoon', 'evening'
          
          if (timeSlot === 'morning' && slotHour >= 8 && slotHour < 12) return true;
          if (timeSlot === 'afternoon' && slotHour >= 12 && slotHour < 17) return true;
          if (timeSlot === 'evening' && slotHour >= 17 && slotHour < 21) return true;
          
          return false;
        }
        
        return true;
      });

      if (matchingSlot || !newly_available_slots) {
        // Notify patient via multi-channel
        const notificationData = {
          waitlist_id: entry.id,
          specialist_id: specialist_id,
          specialist_name: `Dr. ${entry.specialist.user.first_name} ${entry.specialist.user.last_name}`,
          available_slot: matchingSlot || 'Multiple slots available',
          booking_link: `${supabaseUrl}/book-appointment?specialist=${specialist_id}&waitlist=${entry.id}`
        };

        // Send notification
        await supabase.from('notifications').insert({
          user_id: entry.patient_id,
          title: 'Appointment Slot Available!',
          message: `Good news! Dr. ${entry.specialist.user.first_name} ${entry.specialist.user.last_name} now has ${matchingSlot ? 'a slot on ' + new Date(matchingSlot.start_time).toLocaleDateString() : 'availability'}. Book now before it fills up!`,
          type: 'waitlist_match',
          data: notificationData,
        });

        // Send SMS if phone available
        if (entry.patient.phone) {
          await supabase.functions.invoke('send-sms', {
            body: {
              to: entry.patient.phone,
              message: `Appointment slot available with Dr. ${entry.specialist.user.first_name} ${entry.specialist.user.last_name}! Book now: ${notificationData.booking_link}`
            }
          });
        }

        // Send email
        if (entry.patient.email) {
          await supabase.functions.invoke('send-email', {
            body: {
              to: entry.patient.email,
              subject: 'Your Waitlist Match - Appointment Slot Available',
              html: `
                <h2>Good News!</h2>
                <p>Hello ${entry.patient.first_name},</p>
                <p>Dr. ${entry.specialist.user.first_name} ${entry.specialist.user.last_name} now has ${matchingSlot ? 'an appointment slot available on ' + new Date(matchingSlot.start_time).toLocaleString() : 'availability'}.</p>
                <p><a href="${notificationData.booking_link}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Book Now</a></p>
                <p>This slot is available on a first-come, first-served basis.</p>
              `
            }
          });
        }

        // Update waitlist entry
        await supabase
          .from('appointment_waitlist')
          .update({
            status: 'notified',
            notified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.id);

        notifications.push({
          patient_id: entry.patient_id,
          patient_name: `${entry.patient.first_name} ${entry.patient.last_name}`,
          channels: ['app', entry.patient.phone ? 'sms' : null, entry.patient.email ? 'email' : null].filter(Boolean),
          slot: matchingSlot
        });

        matches.push(entry.id);
      }
    }

    console.log(`Notified ${notifications.length} patients from waitlist`);

    return new Response(JSON.stringify({
      success: true,
      notified_count: notifications.length,
      notifications: notifications,
      matched_waitlist_ids: matches
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notify-waitlist-slot-available:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
