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

    const { shift_id, specialist_id, action } = await req.json();

    console.log('Shift schedule sync:', { shift_id, specialist_id, action });

    // Get shift details
    const { data: shift, error: shiftError } = await supabase
      .from('marketplace_shifts')
      .select('*, clinic:clinics(id, name)')
      .eq('id', shift_id)
      .single();

    if (shiftError) throw shiftError;

    if (action === 'accept') {
      // Update shift status
      await supabase
        .from('marketplace_shifts')
        .update({
          specialist_id,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', shift_id);

      // Add specialist to clinic staff if not already
      const { data: existingStaff } = await supabase
        .from('clinic_staff')
        .select('id')
        .eq('clinic_id', shift.clinic_id)
        .eq('user_id', specialist_id)
        .single();

      if (!existingStaff) {
        const { data: specialistUser } = await supabase
          .from('specialists')
          .select('user_id')
          .eq('id', specialist_id)
          .single();

        if (specialistUser) {
          await supabase.from('clinic_staff').insert({
            clinic_id: shift.clinic_id,
            user_id: specialistUser.user_id,
            role: 'specialist',
            is_active: true,
            permissions: {
              can_view_appointments: true,
              can_create_appointments: true,
              can_view_patients: true
            }
          });
        }
      }

      // Block availability during shift time
      const dayOfWeek = new Date(shift.shift_date).getDay();
      
      await supabase.from('availability_schedules').insert({
        specialist_id,
        day_of_week: dayOfWeek,
        start_time: shift.start_time,
        end_time: shift.end_time,
        is_active: false // Blocked
      }).select();

      // Sync to external calendar if connected
      const { data: calendarTokens } = await supabase
        .from('calendar_providers')
        .select('*')
        .eq('user_id', (await supabase.from('specialists').select('user_id').eq('id', specialist_id).single()).data?.user_id)
        .eq('sync_enabled', true);

      for (const token of calendarTokens || []) {
        try {
          await supabase.functions.invoke('sync-calendar', {
            body: {
              provider: token.provider,
              user_id: specialist_id,
              event: {
                summary: `Shift at ${shift.clinic.name}`,
                description: `Healthcare shift - ${shift.role_required}`,
                start: {
                  dateTime: `${shift.shift_date}T${shift.start_time}`,
                  timeZone: 'UTC'
                },
                end: {
                  dateTime: `${shift.shift_date}T${shift.end_time}`,
                  timeZone: 'UTC'
                }
              }
            }
          });
        } catch (calError) {
          console.error('Calendar sync failed:', calError);
          // Don't fail the whole operation
        }
      }

      // Create notification
      await supabase.from('user_notifications').insert({
        user_id: specialist_id,
        notification_type: 'shift_accepted',
        title: 'Shift Confirmed',
        message: `Your shift at ${shift.clinic.name} on ${new Date(shift.shift_date).toLocaleDateString()} has been confirmed.`,
        action_url: `/shift-marketplace?shift=${shift_id}`,
        metadata: { shift_id, clinic_id: shift.clinic_id }
      });

      console.log('Shift accepted and synced:', shift_id);

      return new Response(JSON.stringify({
        success: true,
        message: 'Shift accepted and availability blocked',
        shift_id,
        calendar_synced: (calendarTokens?.length || 0) > 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'cancel') {
      // Update shift status
      await supabase
        .from('marketplace_shifts')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', shift_id);

      // Restore availability
      const dayOfWeek = new Date(shift.shift_date).getDay();
      
      await supabase
        .from('availability_schedules')
        .delete()
        .eq('specialist_id', specialist_id)
        .eq('day_of_week', dayOfWeek)
        .eq('start_time', shift.start_time)
        .eq('end_time', shift.end_time)
        .eq('is_active', false);

      console.log('Shift cancelled and availability restored:', shift_id);

      return new Response(JSON.stringify({
        success: true,
        message: 'Shift cancelled and availability restored',
        shift_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in shift-schedule-sync:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
