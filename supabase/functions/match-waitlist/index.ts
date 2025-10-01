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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get waiting patients
    const { data: waitlist, error: waitlistError } = await supabase
      .from("appointment_waitlist")
      .select("*")
      .eq("status", "waiting")
      .order("created_at", { ascending: true });

    if (waitlistError) throw waitlistError;

    const matches = [];

    for (const entry of waitlist) {
      // Get specialist availability
      const { data: schedules } = await supabase
        .from("availability_schedules")
        .select("*")
        .eq("specialist_id", entry.specialist_id)
        .eq("is_active", true);

      if (!schedules || schedules.length === 0) continue;

      // Calculate match score based on preferences
      const matchScore = calculateMatchScore(entry, schedules);

      if (matchScore > 0.7) {
        matches.push({
          waitlist_id: entry.id,
          match_score: matchScore,
          match_criteria: {
            dateMatch: entry.preferred_date ? 0.5 : 0,
            timeMatch: entry.preferred_time_slot ? 0.3 : 0,
            availabilityMatch: 0.2,
          },
        });

        // Update waitlist status
        await supabase
          .from("appointment_waitlist")
          .update({ status: "matched" })
          .eq("id", entry.id);
      }
    }

    // Insert matches
    if (matches.length > 0) {
      const { error: matchError } = await supabase
        .from("waitlist_matches")
        .insert(matches);

      if (matchError) console.error("Match insert error:", matchError);
    }

    return new Response(
      JSON.stringify({ success: true, matchCount: matches.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Waitlist matching error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateMatchScore(entry: any, schedules: any[]): number {
  let score = 0.5; // Base score

  if (entry.preferred_date) {
    const dayOfWeek = new Date(entry.preferred_date).getDay();
    const hasMatchingDay = schedules.some(s => s.day_of_week === dayOfWeek);
    if (hasMatchingDay) score += 0.3;
  }

  if (entry.preferred_time_slot) {
    score += 0.2;
  }

  return Math.min(score, 1.0);
}