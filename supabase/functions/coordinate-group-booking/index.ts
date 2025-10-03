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
    const { session_id, action } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('group_booking_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    if (action === 'find_slots') {
      // Find common available slots for all specialists
      const { data: slotsData, error: slotsError } = await supabase.functions.invoke(
        'find-available-slots',
        {
          body: {
            specialistIds: session.specialist_ids,
            startDate: session.preferred_date,
            endDate: session.preferred_date,
            durationMinutes: session.duration_minutes,
            use_cache: true
          }
        }
      );

      if (slotsError) throw slotsError;

      // Group slots by time to find overlapping availability
      const timeSlots = new Map<string, any[]>();
      
      for (const slot of slotsData.slots || []) {
        const timeKey = `${slot.start_time}-${slot.end_time}`;
        if (!timeSlots.has(timeKey)) {
          timeSlots.set(timeKey, []);
        }
        timeSlots.get(timeKey)!.push(slot);
      }

      // Find slots where ALL specialists are available
      const perfectMatches = [];
      const partialMatches = [];

      for (const [timeKey, slots] of timeSlots.entries()) {
        const uniqueSpecialists = new Set(slots.map(s => s.specialist_id));
        
        if (uniqueSpecialists.size === session.specialist_ids.length) {
          perfectMatches.push({
            time_key: timeKey,
            start_time: slots[0].start_time,
            end_time: slots[0].end_time,
            specialists: Array.from(uniqueSpecialists)
          });
        } else if (uniqueSpecialists.size >= session.specialist_ids.length * 0.7) {
          // At least 70% of specialists available
          partialMatches.push({
            time_key: timeKey,
            start_time: slots[0].start_time,
            end_time: slots[0].end_time,
            specialists: Array.from(uniqueSpecialists),
            missing_count: session.specialist_ids.length - uniqueSpecialists.size
          });
        }
      }

      console.log(`Group booking: ${perfectMatches.length} perfect matches, ${partialMatches.length} partial`);

      return new Response(
        JSON.stringify({
          success: true,
          perfect_matches: perfectMatches,
          partial_matches: partialMatches,
          suggestion: perfectMatches.length === 0 ? 
            'Consider booking specialists sequentially or on different dates' : null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'confirm_booking') {
      const { confirmed_slots } = await req.json();
      
      // Create appointments atomically
      const appointments = [];
      
      for (const slot of confirmed_slots) {
        const { data: appointment, error: aptError } = await supabase
          .from('appointments')
          .insert({
            patient_id: user.id,
            specialist_id: slot.specialist_id,
            scheduled_at: slot.start_time,
            duration_minutes: session.duration_minutes,
            status: 'confirmed',
            consultation_type: 'in_person',
            fee: 0, // To be set based on specialist rates
            notes: `Group booking session ${session_id}`
          })
          .select()
          .single();

        if (aptError) {
          // Rollback - cancel all created appointments
          if (appointments.length > 0) {
            await supabase
              .from('appointments')
              .update({ status: 'cancelled', cancellation_reason: 'Group booking failed' })
              .in('id', appointments.map(a => a.id));
          }
          throw new Error(`Failed to create appointment: ${aptError.message}`);
        }

        appointments.push(appointment);
      }

      // Update session status
      await supabase
        .from('group_booking_sessions')
        .update({
          status: 'confirmed',
          confirmed_slots: confirmed_slots
        })
        .eq('id', session_id);

      // Send confirmation notifications
      await supabase.functions.invoke('send-multi-channel-notification', {
        body: {
          user_id: user.id,
          title: 'Group Booking Confirmed',
          message: `Your group booking with ${appointments.length} specialists is confirmed for ${session.preferred_date}`,
          channels: ['email', 'push']
        }
      });

      console.log(`Created ${appointments.length} appointments for group session ${session_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          appointments,
          session_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: any) {
    console.error('Group booking error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});