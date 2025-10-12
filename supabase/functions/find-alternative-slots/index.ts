import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlternativeSlotRequest {
  specialist_id: string;
  requested_time: string;
  specialty?: string;
  duration_minutes?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { specialist_id, requested_time, specialty, duration_minutes = 30 } = 
      await req.json() as AlternativeSlotRequest;

    console.log('Finding alternatives for:', { specialist_id, requested_time, specialty });

    // Check cache first
    const { data: cached } = await supabase
      .from('alternative_slot_cache')
      .select('*')
      .eq('specialist_id', specialist_id)
      .eq('original_slot', requested_time)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      console.log('Returning cached alternatives');
      return new Response(
        JSON.stringify({ alternatives: cached.alternative_slots }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestedDate = new Date(requested_time);
    const alternatives = [];

    // Strategy 1: Same specialist, nearby times (±2 hours)
    const timeRangeStart = new Date(requestedDate.getTime() - 2 * 60 * 60 * 1000);
    const timeRangeEnd = new Date(requestedDate.getTime() + 2 * 60 * 60 * 1000);

    const { data: sameSpecialistSlots } = await supabase
      .from('availability_schedules')
      .select(`
        *,
        specialists!inner(
          id,
          user_id,
          bio,
          rating,
          profiles!inner(first_name, last_name, avatar_url)
        )
      `)
      .eq('specialist_id', specialist_id)
      .eq('is_active', true);

    if (sameSpecialistSlots && sameSpecialistSlots.length > 0) {
      // Find available slots around requested time
      for (const schedule of sameSpecialistSlots) {
        const dayOfWeek = requestedDate.getDay();
        if (schedule.day_of_week === dayOfWeek) {
          // Create time slots
          const startTime = new Date(requestedDate);
          const [hours, minutes] = schedule.start_time.split(':');
          startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          const endTime = new Date(requestedDate);
          const [endHours, endMinutes] = schedule.end_time.split(':');
          endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

          while (startTime < endTime) {
            if (startTime >= timeRangeStart && startTime <= timeRangeEnd) {
              // Check if slot is available
              const { data: existingAppt } = await supabase
                .from('appointments')
                .select('id')
                .eq('specialist_id', specialist_id)
                .eq('scheduled_at', startTime.toISOString())
                .not('status', 'in', '("cancelled","no_show")')
                .single();

              if (!existingAppt) {
                alternatives.push({
                  time: startTime.toISOString(),
                  specialist_id: specialist_id,
                  specialist_name: `${schedule.specialists.profiles.first_name} ${schedule.specialists.profiles.last_name}`,
                  rating: schedule.specialists.rating,
                  avatar_url: schedule.specialists.profiles.avatar_url,
                  reason: 'Same specialist, nearby time',
                  time_diff_minutes: Math.abs((startTime.getTime() - requestedDate.getTime()) / 60000),
                });
              }
            }
            startTime.setMinutes(startTime.getMinutes() + duration_minutes);
          }
        }
      }
    }

    // Strategy 2: Similar specialists, same time slot
    if (specialty && alternatives.length < 5) {
      const { data: similarSpecialists } = await supabase
        .from('specialists')
        .select(`
          id,
          user_id,
          bio,
          rating,
          profiles!inner(first_name, last_name, avatar_url),
          availability_schedules!inner(*)
        `)
        .contains('specialty', [specialty])
        .neq('id', specialist_id)
        .eq('is_accepting_patients', true)
        .order('rating', { ascending: false })
        .limit(10);

      if (similarSpecialists) {
        for (const specialist of similarSpecialists) {
          const { data: existingAppt } = await supabase
            .from('appointments')
            .select('id')
            .eq('specialist_id', specialist.id)
            .eq('scheduled_at', requested_time)
            .not('status', 'in', '("cancelled","no_show")')
            .single();

          if (!existingAppt && alternatives.length < 5) {
            alternatives.push({
              time: requested_time,
              specialist_id: specialist.id,
              specialist_name: `${specialist.profiles.first_name} ${specialist.profiles.last_name}`,
              rating: specialist.rating,
              avatar_url: specialist.profiles.avatar_url,
              reason: 'Similar specialist, exact time',
              time_diff_minutes: 0,
            });
          }
        }
      }
    }

    // Sort by time proximity and rating
    alternatives.sort((a, b) => {
      const timeDiff = a.time_diff_minutes - b.time_diff_minutes;
      if (timeDiff !== 0) return timeDiff;
      return (b.rating || 0) - (a.rating || 0);
    });

    const topAlternatives = alternatives.slice(0, 5);

    // Cache the results
    await supabase.from('alternative_slot_cache').insert({
      specialist_id,
      original_slot: requested_time,
      alternative_slots: topAlternatives,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    console.log(`Found ${topAlternatives.length} alternatives`);

    return new Response(
      JSON.stringify({ alternatives: topAlternatives }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error finding alternatives:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});