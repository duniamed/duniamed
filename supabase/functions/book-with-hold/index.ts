import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Upstash Redis configuration (set via secrets)
const UPSTASH_REDIS_URL = Deno.env.get("UPSTASH_REDIS_URL");
const UPSTASH_REDIS_TOKEN = Deno.env.get("UPSTASH_REDIS_TOKEN");

interface HoldRequest {
  specialist_id: string;
  scheduled_at: string;
  duration_minutes: number;
  patient_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json() as { action: 'hold' | 'commit' | 'release' } & HoldRequest;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "hold") {
      // 1. Check if slot is available (not already held or booked)
      const { data: existing } = await supabase
        .from("appointments")
        .select("id, status")
        .eq("specialist_id", data.specialist_id)
        .eq("scheduled_at", data.scheduled_at)
        .in("status", ["pending", "confirmed", "hold"])
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ success: false, error: "Slot no longer available" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
        );
      }

      // 2. Create hold in database
      const holdId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60000); // 60 seconds

      const { error: insertError } = await supabase
        .from("appointments")
        .insert({
          id: holdId,
          specialist_id: data.specialist_id,
          patient_id: data.patient_id,
          scheduled_at: data.scheduled_at,
          duration_minutes: data.duration_minutes,
          status: "hold",
          consultation_type: "video",
          fee: 0,
          currency: "USD",
        });

      if (insertError) throw insertError;

      // 3. Store hold in Redis with 60s TTL
      if (UPSTASH_REDIS_URL && UPSTASH_REDIS_TOKEN) {
        const redisKey = `hold:${data.specialist_id}:${data.scheduled_at}`;
        await fetch(`${UPSTASH_REDIS_URL}/set/${redisKey}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${UPSTASH_REDIS_TOKEN}` },
          body: JSON.stringify({ value: holdId, ex: 60 }),
        });
      }

      // 4. Schedule auto-release after 60s (async background task)
      setTimeout(async () => {
        const { data: stillHold } = await supabase
          .from("appointments")
          .select("status")
          .eq("id", holdId)
          .maybeSingle();

        if (stillHold?.status === "hold") {
          await supabase
            .from("appointments")
            .delete()
            .eq("id", holdId);
        }
      }, 61000);

      return new Response(
        JSON.stringify({
          success: true,
          hold_id: holdId,
          expires_at: expiresAt.toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "commit") {
      // Atomically commit the hold to a real booking
      const { data: holdData, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", data.patient_id) // Using patient_id as hold_id here
        .eq("status", "hold")
        .single();

      if (fetchError || !holdData) {
        return new Response(
          JSON.stringify({ success: false, error: "Hold expired or invalid" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 410 }
        );
      }

      // Update to confirmed status
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "pending" })
        .eq("id", holdData.id);

      if (updateError) throw updateError;

      // Remove from Redis
      if (UPSTASH_REDIS_URL && UPSTASH_REDIS_TOKEN) {
        const redisKey = `hold:${holdData.specialist_id}:${holdData.scheduled_at}`;
        await fetch(`${UPSTASH_REDIS_URL}/del/${redisKey}`, {
          headers: { Authorization: `Bearer ${UPSTASH_REDIS_TOKEN}` },
        });
      }

      return new Response(
        JSON.stringify({ success: true, appointment_id: holdData.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "release") {
      // Manually release a hold
      await supabase
        .from("appointments")
        .delete()
        .eq("id", data.patient_id)
        .eq("status", "hold");

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error: any) {
    console.error("Hold error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
