import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HoldRequest {
  patient_id: string;
  specialist_id: string;
  scheduled_at: string;
  duration_minutes: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const holdData: HoldRequest = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if slot is still available
    const { data: existingHold } = await supabase
      .from("appointments")
      .select("id")
      .eq("specialist_id", holdData.specialist_id)
      .eq("scheduled_at", holdData.scheduled_at)
      .in("status", ["pending", "confirmed", "hold"])
      .maybeSingle();

    if (existingHold) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "slot_taken",
          message: "This slot is no longer available",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Create 60-second hold
    const holdId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60000).toISOString();

    const { error: holdError } = await supabase.from("appointments").insert({
      id: holdId,
      patient_id: holdData.patient_id,
      specialist_id: holdData.specialist_id,
      scheduled_at: holdData.scheduled_at,
      duration_minutes: holdData.duration_minutes,
      status: "hold",
      consultation_type: "video",
      fee: 0,
      currency: "USD",
    });

    if (holdError) {
      throw new Error(`Failed to create hold: ${holdError.message}`);
    }

    // Schedule auto-release after 60 seconds
    setTimeout(async () => {
      const { data: currentHold } = await supabase
        .from("appointments")
        .select("status")
        .eq("id", holdId)
        .single();

      if (currentHold?.status === "hold") {
        await supabase.from("appointments").delete().eq("id", holdId);
        console.log(`Auto-released expired hold: ${holdId}`);
      }
    }, 60000);

    return new Response(
      JSON.stringify({
        success: true,
        hold_id: holdId,
        expires_at: expiresAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Hold creation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "hold_failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
