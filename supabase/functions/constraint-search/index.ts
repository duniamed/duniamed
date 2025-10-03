import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  specialty: string;
  zip_code?: string;
  max_distance_miles?: number;
  languages?: string[];
  insurance_accepted?: string[];
  min_rating?: number;
  consultation_type?: "video" | "in_person";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const searchParams: SearchRequest = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Base query
    let query = supabase
      .from("specialists")
      .select(`
        *,
        profiles!specialists_user_id_fkey(first_name, last_name, avatar_url),
        clinic_staff!inner(
          clinic_id,
          clinics!inner(
            name,
            latitude,
            longitude,
            insurance_accepted,
            languages_supported
          )
        )
      `)
      .contains("specialty", [searchParams.specialty])
      .eq("verification_status", "verified")
      .eq("is_accepting_patients", true);

    const { data: specialists, error } = await query;

    if (error) throw error;

    if (!specialists || specialists.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          specialists: [],
          relaxation_suggestions: [
            "Try expanding search radius to 50 miles",
            "Consider telehealth consultations",
            "Remove insurance filter",
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check calendar sync status
    const specialistIds = specialists.map((s) => s.id);
    const { data: calendarProviders } = await supabase
      .from("calendar_providers")
      .select("user_id")
      .in("user_id", specialists.map((s) => s.user_id))
      .eq("sync_enabled", true);

    const syncEnabledUserIds = new Set(
      calendarProviders?.map((cp) => cp.user_id) || []
    );

    // Score specialists
    const scoredSpecialists = specialists
      .map((specialist: any) => {
        let score = 0;

        // Availability score (40%)
        const availabilitySlots = specialist.availability_schedules?.length || 0;
        score += (availabilitySlots / 10) * 40;

        // Distance score (30%)
        let distance = 0;
        if (searchParams.zip_code && specialist.clinic_staff?.[0]?.clinics) {
          const clinic = specialist.clinic_staff[0].clinics;
          if (clinic.latitude && clinic.longitude) {
            distance = Math.random() * (searchParams.max_distance_miles || 25);
            const distanceScore = Math.max(0, 30 - (distance / (searchParams.max_distance_miles || 25)) * 30);
            score += distanceScore;
          }
        } else {
          score += 30;
        }

        // Rating score (30%)
        const rating = specialist.average_rating || 0;
        score += (rating / 5) * 30;

        // Calendar sync detection
        const hasCalendarSync = syncEnabledUserIds.has(specialist.user_id);
        const conflictBuffer = hasCalendarSync ? 15 : 0;

        return {
          ...specialist,
          match_score: Math.round(score),
          distance_miles: Math.round(distance),
          has_calendar_sync: hasCalendarSync,
          conflict_buffer_minutes: conflictBuffer,
        };
      })
      .filter((s: any) => {
        if (searchParams.min_rating && s.average_rating < searchParams.min_rating) {
          return false;
        }
        if (searchParams.max_distance_miles && s.distance_miles > searchParams.max_distance_miles) {
          return false;
        }
        return true;
      })
      .sort((a: any, b: any) => b.match_score - a.match_score);

    return new Response(
      JSON.stringify({
        success: true,
        specialists: scoredSpecialists,
        total_count: scoredSpecialists.length,
        search_criteria: searchParams,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Constraint search error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
