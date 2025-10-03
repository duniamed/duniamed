import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      specialty,
      patientLocation,
      maxDistance = 10,
      languages = [],
      insuranceId,
      startDate,
      endDate,
    } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get specialists matching specialty
    const { data: specialists, error: specialistsError } = await supabase
      .from("specialists")
      .select(`
        id,
        user_id,
        specialty,
        languages,
        is_accepting_patients,
        profiles!inner(first_name, last_name),
        clinic_staff!inner(clinic_id, clinics!inner(
          id,
          name,
          latitude,
          longitude
        ))
      `)
      .contains("specialty", [specialty])
      .eq("is_accepting_patients", true)
      .eq("verification_status", "verified");

    if (specialistsError) throw specialistsError;

    // Filter by distance and language
    const candidates = (specialists || []).filter((spec: any) => {
      const clinic = spec.clinic_staff?.[0]?.clinics;
      if (!clinic || !clinic.latitude || !clinic.longitude) return false;

      const distance = calculateDistance(
        patientLocation.latitude,
        patientLocation.longitude,
        parseFloat(clinic.latitude),
        parseFloat(clinic.longitude)
      );

      const withinDistance = distance <= maxDistance;
      const languageMatch =
        languages.length === 0 ||
        languages.some((lang: string) => spec.languages?.includes(lang));

      return withinDistance && languageMatch;
    });

    // Get availability for each candidate
    const results = [];

    for (const specialist of candidates) {
      const { data: schedules } = await supabase
        .from("availability_schedules")
        .select("*")
        .eq("specialist_id", specialist.id)
        .eq("is_active", true);

      const { data: appointments } = await supabase
        .from("appointments")
        .select("scheduled_at, duration_minutes")
        .eq("specialist_id", specialist.id)
        .gte("scheduled_at", startDate)
        .lte("scheduled_at", endDate)
        .neq("status", "cancelled");

      // Find next available slot
      let nextAvailable = null;
      const currentDate = new Date(startDate);
      const searchEndDate = new Date(endDate);

      while (currentDate <= searchEndDate && !nextAvailable) {
        const dayOfWeek = currentDate.getDay();
        const daySchedules = schedules?.filter((s) => s.day_of_week === dayOfWeek);

        for (const schedule of daySchedules || []) {
          const scheduleStart = new Date(currentDate);
          const [startHour, startMinute] = schedule.start_time.split(":").map(Number);
          scheduleStart.setHours(startHour, startMinute, 0, 0);

          const scheduleEnd = new Date(currentDate);
          const [endHour, endMinute] = schedule.end_time.split(":").map(Number);
          scheduleEnd.setHours(endHour, endMinute, 0, 0);

          let slotStart = new Date(scheduleStart);

          while (slotStart < scheduleEnd) {
            const slotEnd = new Date(slotStart.getTime() + 30 * 60000);

            const hasConflict = appointments?.some((apt) => {
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

            if (!hasConflict && slotStart > new Date()) {
              nextAvailable = slotStart.toISOString();
              break;
            }

            slotStart = new Date(slotStart.getTime() + 30 * 60000);
          }

          if (nextAvailable) break;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const clinic = Array.isArray(specialist.clinic_staff?.[0]?.clinics) 
        ? specialist.clinic_staff[0].clinics[0]
        : specialist.clinic_staff?.[0]?.clinics;
      
      const distance = calculateDistance(
        patientLocation.latitude,
        patientLocation.longitude,
        parseFloat(String(clinic?.latitude || 0)),
        parseFloat(String(clinic?.longitude || 0))
      );

      // Get reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("specialist_id", specialist.id);

      const avgRating =
        reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null;

      const profile = Array.isArray(specialist.profiles) 
        ? specialist.profiles[0] 
        : specialist.profiles;

      results.push({
        specialist_id: specialist.id,
        name: `${profile?.first_name || ''} ${profile?.last_name || ''}`,
        specialty: specialist.specialty,
        languages: specialist.languages,
        clinic_name: clinic?.name || '',
        distance_miles: distance.toFixed(1),
        next_available: nextAvailable,
        rating: avgRating ? avgRating.toFixed(1) : null,
        review_count: reviews?.length || 0,
      });
    }

    // Sort by composite score: availability (40%), distance (30%), rating (30%)
    results.sort((a, b) => {
      const aScore =
        (a.next_available ? 40 : 0) +
        (30 * (1 - parseFloat(a.distance_miles) / maxDistance)) +
        (a.rating ? (parseFloat(a.rating) / 5) * 30 : 0);

      const bScore =
        (b.next_available ? 40 : 0) +
        (30 * (1 - parseFloat(b.distance_miles) / maxDistance)) +
        (b.rating ? (parseFloat(b.rating) / 5) * 30 : 0);

      return bScore - aScore;
    });

    // Generate relaxation suggestions if no results
    const suggestions = [];
    if (results.length === 0) {
      // Try expanding distance
      const expandedSearch = await supabase
        .from("specialists")
        .select("id")
        .contains("specialty", [specialty])
        .eq("is_accepting_patients", true);

      if ((expandedSearch.data?.length || 0) > 0) {
        suggestions.push({
          type: "expand_distance",
          message: `No providers found within ${maxDistance} miles. Expand to 25 miles?`,
          count: expandedSearch.data?.length || 0,
        });
      }

      // Try removing language constraint
      if (languages.length > 0) {
        suggestions.push({
          type: "remove_language",
          message: "Accept English-speaking provider with interpreter service?",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: results.slice(0, 10),
        total_found: results.length,
        suggestions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Search error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
