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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { action, session_id, session_data, slot_selection } = await req.json();

    if (action === 'create_session') {
      // Create a new group booking session
      const { data: session, error: sessionError } = await supabase
        .from('group_booking_sessions')
        .insert({
          created_by: user.id,
          session_name: session_data.session_name,
          specialty: session_data.specialty,
          preferred_date: session_data.preferred_date,
          preferred_time: session_data.preferred_time,
          members: session_data.members,
          status: 'pending'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      return new Response(JSON.stringify({
        success: true,
        session
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'find_consecutive_slots') {
      // Find consecutive available slots for all members
      const { specialty, preferred_date, member_count } = session_data;

      // Query specialists with the required specialty
      const { data: specialists } = await supabase
        .from('specialists')
        .select('id, specialty')
        .contains('specialty', [specialty])
        .eq('is_accepting_patients', true);

      if (!specialists || specialists.length === 0) {
        throw new Error('No specialists available for this specialty');
      }

      // Find consecutive slots
      const consecutiveSlots = [];

      for (const specialist of specialists) {
        // Get availability
        const targetDate = new Date(preferred_date);
        const dayOfWeek = targetDate.getDay();

        const { data: schedules } = await supabase
          .from('availability_schedules')
          .select('*')
          .eq('specialist_id', specialist.id)
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true);

        if (!schedules || schedules.length === 0) continue;

        // Get existing appointments
        const { data: appointments } = await supabase
          .from('appointments')
          .select('scheduled_at, duration_minutes')
          .eq('specialist_id', specialist.id)
          .gte('scheduled_at', preferred_date)
          .lt('scheduled_at', preferred_date + ' 23:59:59');

        // Generate 30-minute slots and check for consecutive availability
        for (const schedule of schedules) {
          const slots = generateConsecutiveSlots(
            schedule.start_time,
            schedule.end_time,
            member_count,
            appointments || []
          );

          if (slots.length > 0) {
            consecutiveSlots.push({
              specialist_id: specialist.id,
              date: preferred_date,
              available_slots: slots
            });
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        consecutive_slots: consecutiveSlots
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'confirm_booking') {
      // Confirm and create all appointments atomically
      const { data: session } = await supabase
        .from('group_booking_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('created_by', user.id)
        .single();

      if (!session) throw new Error('Session not found');

      // Create appointments for each member
      const appointmentIds = [];
      const members = session.members as any[];

      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const slotTime = slot_selection.times[i];
        const scheduledAt = `${slot_selection.date}T${slotTime}:00`;

        const appointmentData: any = {
          patient_id: member.patient_id || user.id,
          specialist_id: slot_selection.specialist_id,
          scheduled_at: scheduledAt,
          consultation_type: 'in_person',
          chief_complaint: `Group booking - ${session.specialty}`,
          status: 'pending',
          duration_minutes: 30
        };

        // If booking for family member
        if (member.family_member_id) {
          appointmentData.booked_for_member_id = member.family_member_id;
          appointmentData.proxy_booked_by = user.id;
        }

        const { data: appointment, error: aptError } = await supabase
          .from('appointments')
          .insert(appointmentData)
          .select()
          .single();

        if (aptError) {
          // Rollback - delete previously created appointments
          if (appointmentIds.length > 0) {
            await supabase
              .from('appointments')
              .delete()
              .in('id', appointmentIds);
          }
          throw new Error(`Failed to create appointment for ${member.name}: ${aptError.message}`);
        }

        appointmentIds.push(appointment.id);
      }

      // Update session as booked
      await supabase
        .from('group_booking_sessions')
        .update({
          status: 'booked',
          booked_at: new Date().toISOString(),
          appointment_ids: appointmentIds,
          selected_slot: slot_selection
        })
        .eq('id', session_id);

      console.log('Group booking completed:', {
        session_id,
        appointments: appointmentIds.length
      });

      return new Response(JSON.stringify({
        success: true,
        appointment_ids: appointmentIds,
        message: `Successfully booked ${appointmentIds.length} consecutive appointments`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in coordinate-group-booking:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to generate consecutive available slots
function generateConsecutiveSlots(
  startTime: string,
  endTime: string,
  count: number,
  existingAppointments: any[]
): string[] {
  const slots: string[] = [];
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  for (let time = start; time < end; time += 30) {
    const timeStr = formatTime(time);
    
    // Check if this slot and next (count-1) slots are available
    let allAvailable = true;
    for (let i = 0; i < count; i++) {
      const checkTime = time + (i * 30);
      if (checkTime >= end || isSlotBooked(formatTime(checkTime), existingAppointments)) {
        allAvailable = false;
        break;
      }
    }
    
    if (allAvailable) {
      slots.push(timeStr);
    }
  }
  
  return slots;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function isSlotBooked(slotTime: string, appointments: any[]): boolean {
  return appointments.some(apt => {
    const aptTime = new Date(apt.scheduled_at).toTimeString().substring(0, 5);
    return aptTime === slotTime;
  });
}