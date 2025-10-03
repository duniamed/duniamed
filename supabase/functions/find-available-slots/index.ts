import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      specialistIds,
      startDate,
      endDate,
      durationMinutes = 30,
      resourceRequirements = [],
      use_cache = true,
    } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const availableSlots: Array<{
      start_time: string;
      end_time: string;
      specialist_ids: string[];
      duration_minutes: number;
    }> = [];

    // Try to use cache first
    if (use_cache) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      const { data: cachedData } = await supabase
        .from('specialist_availability_cache')
        .select('*')
        .in('specialist_id', specialistIds)
        .gte('date', startDateObj.toISOString().split('T')[0])
        .lte('date', endDateObj.toISOString().split('T')[0])
        .gt('expires_at', new Date().toISOString());

      if (cachedData && cachedData.length > 0) {
        console.log(`Cache hit: ${cachedData.length} cached availability records`);
        
        // Convert cached data to slot format
        cachedData.forEach((cache: any) => {
          const slots = cache.available_slots as any[];
          slots?.filter((s: any) => s.available).forEach((slot: any) => {
            const slotDate = new Date(cache.date);
            const [hour, minute] = slot.start_time.split(':');
            slotDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
            
            const [endHour, endMinute] = slot.end_time.split(':');
            const slotEndDate = new Date(cache.date);
            slotEndDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

            availableSlots.push({
              start_time: slotDate.toISOString(),
              end_time: slotEndDate.toISOString(),
              specialist_ids: [cache.specialist_id],
              duration_minutes: durationMinutes,
            });
          });
        });

        if (availableSlots.length > 0) {
          return new Response(
            JSON.stringify({
              success: true,
              source: 'cache',
              slots: availableSlots.slice(0, 50),
              total_found: availableSlots.length,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      console.log('Cache miss or expired, calculating availability...');
    }

    // Get specialist availability schedules
    const { data: schedules } = await supabase
      .from("availability_schedules")
      .select("*")
      .in("specialist_id", specialistIds)
      .eq("is_active", true);

    // Get existing appointments
    const { data: appointments } = await supabase
      .from("appointments")
      .select("specialist_id, scheduled_at, duration_minutes")
      .in("specialist_id", specialistIds)
      .gte("scheduled_at", startDate)
      .lte("scheduled_at", endDate)
      .neq("status", "cancelled");

    // Get resource bookings if resources required
    let resourceBookings: Array<{
      resource_id: string;
      start_time: string;
      end_time: string;
    }> = [];
    if (resourceRequirements.length > 0) {
      const { data: bookings } = await supabase
        .from("resource_bookings")
        .select("resource_id, start_time, end_time")
        .in("resource_id", resourceRequirements)
        .gte("start_time", startDate)
        .lte("end_time", endDate)
        .eq("status", "confirmed");
      resourceBookings = bookings || [];
    }

    // Constraint solving logic
    const currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);

    while (currentDate <= endDateTime) {
      const dayOfWeek = currentDate.getDay();

      // Check each specialist's availability for this day
      for (const specialistId of specialistIds) {
        const specialistSchedule = schedules?.filter(
          (s) => s.specialist_id === specialistId && s.day_of_week === dayOfWeek
        );

        if (!specialistSchedule || specialistSchedule.length === 0) continue;

        for (const schedule of specialistSchedule) {
          // Generate time slots within the schedule
          const scheduleStart = new Date(currentDate);
          const [startHour, startMinute] = schedule.start_time.split(":").map(Number);
          scheduleStart.setHours(startHour, startMinute, 0, 0);

          const scheduleEnd = new Date(currentDate);
          const [endHour, endMinute] = schedule.end_time.split(":").map(Number);
          scheduleEnd.setHours(endHour, endMinute, 0, 0);

          let slotStart = new Date(scheduleStart);

          while (slotStart < scheduleEnd) {
            const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

            if (slotEnd > scheduleEnd) break;

            // Check if slot conflicts with existing appointments
            const hasAppointmentConflict = appointments?.some((apt) => {
              if (apt.specialist_id !== specialistId) return false;
              const aptStart = new Date(apt.scheduled_at);
              const aptEnd = new Date(
                aptStart.getTime() + apt.duration_minutes * 60000
              );
              return (
                (slotStart >= aptStart && slotStart < aptEnd) ||
                (slotEnd > aptStart && slotEnd <= aptEnd) ||
                (slotStart <= aptStart && slotEnd >= aptEnd)
              );
            });

            // Check resource availability
            let hasResourceConflict = false;
            if (resourceRequirements.length > 0) {
              hasResourceConflict = resourceBookings.some((booking) => {
                const bookingStart = new Date(booking.start_time);
                const bookingEnd = new Date(booking.end_time);
                return (
                  (slotStart >= bookingStart && slotStart < bookingEnd) ||
                  (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
                  (slotStart <= bookingStart && slotEnd >= bookingEnd)
                );
              });
            }

            if (!hasAppointmentConflict && !hasResourceConflict) {
              // Check if all specialists are available (for multi-practitioner)
              const allSpecialistsAvailable = specialistIds.every((id: string) => {
                if (id === specialistId) return true;
                
                const otherSchedule = schedules?.find(
                  (s) => s.specialist_id === id && s.day_of_week === dayOfWeek
                );
                if (!otherSchedule) return false;

                const otherStart = new Date(currentDate);
                const [oh, om] = otherSchedule.start_time.split(":").map(Number);
                otherStart.setHours(oh, om, 0, 0);

                const otherEnd = new Date(currentDate);
                const [eh, em] = otherSchedule.end_time.split(":").map(Number);
                otherEnd.setHours(eh, em, 0, 0);

                return slotStart >= otherStart && slotEnd <= otherEnd;
              });

              if (allSpecialistsAvailable) {
                availableSlots.push({
                  start_time: slotStart.toISOString(),
                  end_time: slotEnd.toISOString(),
                  specialist_ids: specialistIds,
                  duration_minutes: durationMinutes,
                });
              }
            }

            slotStart = new Date(slotStart.getTime() + durationMinutes * 60000);
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Limit to first 50 slots
    const limitedSlots = availableSlots.slice(0, 50);

    return new Response(
      JSON.stringify({
        success: true,
        slots: limitedSlots,
        total_found: availableSlots.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Slot finding error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
