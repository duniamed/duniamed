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

    console.log('🔍 Starting constraint search with params:', searchParams);

    // Attempt 1: Exact match with all constraints
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

    if (searchParams.min_rating) {
      query = query.gte("average_rating", searchParams.min_rating);
    }

    if (searchParams.languages && searchParams.languages.length > 0) {
      query = query.overlaps("languages", searchParams.languages);
    }

    const { data: specialists, error } = await query;

    if (error) throw error;

    if (specialists && specialists.length > 0) {
      console.log(`✅ Found ${specialists.length} exact matches`);
      return new Response(
        JSON.stringify({
          success: true,
          specialists,
          constraint_level: 'exact',
          relaxations_applied: [],
          total_count: specialists.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('⚠️ No exact matches. Attempting constraint relaxation...');

    // Attempt 2: Relax rating constraint
    let relaxedQuery = supabase
      .from("specialists")
      .select(`
        *,
        profiles!specialists_user_id_fkey(first_name, last_name, avatar_url),
        clinic_staff!inner(
          clinic_id,
          clinics!inner(name, latitude, longitude, insurance_accepted, languages_supported)
        )
      `)
      .contains("specialty", [searchParams.specialty])
      .eq("verification_status", "verified")
      .eq("is_accepting_patients", true);

    if (searchParams.min_rating && searchParams.min_rating > 3.0) {
      relaxedQuery = relaxedQuery.gte("average_rating", searchParams.min_rating - 0.5);
    }

    const { data: relaxedMatches } = await relaxedQuery;

    if (relaxedMatches && relaxedMatches.length > 0) {
      console.log(`✅ Found ${relaxedMatches.length} matches with relaxed rating`);
      return new Response(
        JSON.stringify({
          success: true,
          specialists: relaxedMatches,
          constraint_level: 'relaxed_rating',
          relaxations_applied: [
            { type: 'rating', from: searchParams.min_rating, to: (searchParams.min_rating || 4) - 0.5 }
          ],
          message: 'Relaxed minimum rating requirement to show more options',
          total_count: relaxedMatches.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Attempt 3: Show specialists without language/insurance filters
    const { data: maxRelaxed } = await supabase
      .from("specialists")
      .select(`
        *,
        profiles!specialists_user_id_fkey(first_name, last_name, avatar_url),
        clinic_staff(
          clinic_id,
          clinics(name, latitude, longitude)
        )
      `)
      .contains("specialty", [searchParams.specialty])
      .eq("verification_status", "verified")
      .eq("is_accepting_patients", true)
      .limit(10);

    if (maxRelaxed && maxRelaxed.length > 0) {
      console.log(`✅ Found ${maxRelaxed.length} matches with all constraints relaxed`);
      return new Response(
        JSON.stringify({
          success: true,
          specialists: maxRelaxed,
          constraint_level: 'maximum_relaxation',
          relaxations_applied: [
            { type: 'rating', removed: true },
            { type: 'languages', removed: true },
            { type: 'insurance', removed: true }
          ],
          message: 'Showing all verified specialists in this specialty. Some may not match your original criteria.',
          total_count: maxRelaxed.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No matches - suggest waitlist
    console.log('❌ No matches found even with maximum relaxation');
    return new Response(
      JSON.stringify({
        success: false,
        specialists: [],
        constraint_level: 'none',
        relaxations_applied: [],
        waitlist_suggested: true,
        message: 'No specialists found matching your criteria. Would you like to join the waitlist for notifications when a specialist becomes available?',
        total_count: 0,
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
