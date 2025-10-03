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

    const { shift_id, action } = await req.json();

    console.log('Syncing shift to availability:', { shift_id, action });

    // Get shift details
    const { data: shift, error: shiftError } = await supabase
      .from('shift_assignments')
      .select(`
        *,
        shift:shift_listings(*)
      `)
      .eq('id', shift_id)
      .single();

    if (shiftError) throw shiftError;

    if (!shift || !shift.shift) {
      throw new Error('Shift not found');
    }

    const shiftListing = shift.shift;
    const startDate = new Date(shiftListing.start_time);
    const endDate = new Date(shiftListing.end_time);

    if (action === 'approved') {
      // Create a time-off entry to block the specialist's regular availability
      const { error: timeOffError } = await supabase
        .from('specialist_time_off')
        .insert({
          specialist_id: shift.specialist_id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          reason: `Shift: ${shiftListing.title}`,
          status: 'approved',
          is_paid: true,
          shift_assignment_id: shift_id,
        });

      if (timeOffError && timeOffError.code !== '23505') { // Ignore duplicate
        console.error('Error creating time-off block:', timeOffError);
      }

      // Create temporary availability for the shift location
      const dayOfWeek = startDate.getDay();
      const startHour = startDate.getHours();
      const startMinute = startDate.getMinutes();
      const endHour = endDate.getHours();
      const endMinute = endDate.getMinutes();

      const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`;

      // Check if a temporary availability already exists
      const { data: existingAvailability } = await supabase
        .from('availability_schedules')
        .select('id')
        .eq('specialist_id', shift.specialist_id)
        .eq('day_of_week', dayOfWeek)
        .eq('start_time', startTime)
        .eq('end_time', endTime)
        .single();

      if (!existingAvailability) {
        const { error: availError } = await supabase
          .from('availability_schedules')
          .insert({
            specialist_id: shift.specialist_id,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            is_active: true,
            location_override: shiftListing.location,
          });

        if (availError) {
          console.error('Error creating availability:', availError);
        }
      }

      // Update shift assignment status
      const { error: updateError } = await supabase
        .from('shift_assignments')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', shift_id);

      if (updateError) throw updateError;

      console.log('Shift synchronized: blocked regular time, added temporary availability');

      return new Response(JSON.stringify({
        success: true,
        message: 'Shift synchronized with availability calendar',
        blocked_time: { start: startDate, end: endDate },
        availability_added: { day: dayOfWeek, start: startTime, end: endTime }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'cancelled') {
      // Remove time-off block
      const { error: deleteTimeOffError } = await supabase
        .from('specialist_time_off')
        .delete()
        .eq('shift_assignment_id', shift_id);

      if (deleteTimeOffError) {
        console.error('Error removing time-off block:', deleteTimeOffError);
      }

      // Remove temporary availability (if it was shift-specific)
      // Note: We don't auto-remove as specialist might want to keep it
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Shift cancelled and availability restored'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-shift-to-availability:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
