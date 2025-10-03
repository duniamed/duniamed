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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { triage_results, symptoms, urgency } = await req.json();

    console.log('AI Triage → Booking Connection:', { user: user.id, urgency, symptoms });

    // Extract recommended specialty from triage results
    const recommendedSpecialty = triage_results.recommended_specialty;
    const urgencyLevel = urgency || triage_results.urgency_level;

    // Find available specialists matching the recommendation
    const { data: specialists, error: specialistError } = await supabase
      .from('specialists')
      .select(`
        id,
        user_id,
        specialty,
        is_accepting_patients,
        verification_status,
        user:profiles!user_id(first_name, last_name, avatar_url)
      `)
      .contains('specialty', [recommendedSpecialty])
      .eq('is_accepting_patients', true)
      .eq('verification_status', 'approved')
      .limit(10);

    if (specialistError) throw specialistError;

    // For each specialist, check their availability in next 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const specialistsWithAvailability = await Promise.all(
      (specialists || []).map(async (specialist) => {
        const { data: availableSlots, error: slotsError } = await supabase
          .from('availability_schedules')
          .select('*')
          .eq('specialist_id', specialist.id)
          .eq('is_active', true);

        if (slotsError) {
          console.error('Error fetching slots:', slotsError);
          return { ...specialist, available_slots: 0, next_available: null };
        }

        // Calculate next available slot
        let nextAvailable = null;
        if (availableSlots && availableSlots.length > 0) {
          // Simple logic: first available day with a schedule
          const today = now.getDay();
          for (let i = 0; i < 7; i++) {
            const checkDay = (today + i) % 7;
            const hasSlot = availableSlots.some(slot => slot.day_of_week === checkDay);
            if (hasSlot) {
              nextAvailable = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
              break;
            }
          }
        }

        return {
          ...specialist,
          available_slots: availableSlots?.length || 0,
          next_available: nextAvailable,
        };
      })
    );

    // Sort by: 1) has availability, 2) earliest next available
    const sortedSpecialists = specialistsWithAvailability
      .filter(s => s.next_available)
      .sort((a, b) => {
        if (!a.next_available) return 1;
        if (!b.next_available) return -1;
        return a.next_available.getTime() - b.next_available.getTime();
      });

    // Create booking suggestions
    const bookingSuggestions = sortedSpecialists.slice(0, 5).map(specialist => {
      const user = Array.isArray(specialist.user) ? specialist.user[0] : specialist.user;
      return {
        specialist_id: specialist.id,
        specialist_name: user ? `${user.first_name} ${user.last_name}` : 'Specialist',
        specialty: specialist.specialty,
        next_available: specialist.next_available,
        urgency_match: urgencyLevel,
        booking_url: `/book/${specialist.id}?from_triage=true&symptoms=${encodeURIComponent(JSON.stringify(symptoms))}`,
      };
    });

    console.log('Generated booking suggestions:', bookingSuggestions.length);

    return new Response(JSON.stringify({
      success: true,
      triage_results,
      booking_suggestions: bookingSuggestions,
      message: bookingSuggestions.length > 0 
        ? `Found ${bookingSuggestions.length} available specialists`
        : 'No immediately available specialists found. Please try expanding your search.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in connect-triage-to-booking:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
