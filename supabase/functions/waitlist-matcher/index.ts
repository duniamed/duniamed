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
    const { specialist_id, scheduled_at } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find waitlist entries for this specialist
    const { data: waitlistEntries } = await supabase
      .from("appointment_waitlist")
      .select("*, profiles!appointment_waitlist_patient_id_fkey(email, phone, first_name)")
      .eq("specialist_id", specialist_id)
      .eq("status", "waiting")
      .order("created_at", { ascending: true });

    if (!waitlistEntries || waitlistEntries.length === 0) {
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Score waitlist entries
    const scoredEntries = waitlistEntries.map((entry) => {
      let score = 0;

      // Base score: days waiting (10 points per day)
      const daysWaiting = Math.floor(
        (Date.now() - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += daysWaiting * 10;

      // Flexibility bonus: accepting any date
      if (!entry.preferred_date) {
        score += 20;
      }

      // Urgency keywords
      const urgencyKeywords = ["urgent", "pain", "emergency", "asap"];
      if (entry.notes && urgencyKeywords.some((kw) => entry.notes.toLowerCase().includes(kw))) {
        score += 15;
      }

      return { ...entry, score };
    });

    // Sort by score (highest first) and take top 3
    const topCandidates = scoredEntries
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Notify top 3 candidates with escalating urgency
    const notificationWindows = [
      { minutes: 15, urgency: "high" },
      { minutes: 10, urgency: "medium" },
      { minutes: 5, urgency: "low" },
    ];

    for (let i = 0; i < topCandidates.length; i++) {
      const candidate = topCandidates[i];
      const window = notificationWindows[i];

      // Send notification
      await supabase.functions.invoke("send-multi-channel-notification", {
        body: {
          user_id: candidate.patient_id,
          channels: ["sms", "email"],
          message: {
            title: "🎯 Appointment Slot Available!",
            body: `Don't lose your place in line! A slot just opened with your preferred specialist. Book within ${window.minutes} minutes to secure it.`,
            action_url: `/book-appointment/${specialist_id}`,
            urgency: window.urgency,
          },
        },
      });

      // Update waitlist entry
      await supabase
        .from("appointment_waitlist")
        .update({
          status: "notified",
          notified_at: new Date().toISOString(),
        })
        .eq("id", candidate.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        notified: topCandidates.length,
        candidates: topCandidates.map((c) => ({
          patient_id: c.patient_id,
          score: c.score,
          booking_window_minutes: notificationWindows[topCandidates.indexOf(c)]?.minutes,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Waitlist matching error:", error);
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
