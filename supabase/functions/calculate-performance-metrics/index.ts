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
    const { specialistId, clinicId, periodStart, periodEnd } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all appointments in the period
    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("*")
      .eq("specialist_id", specialistId)
      .gte("scheduled_at", periodStart)
      .lte("scheduled_at", periodEnd);

    if (apptError) throw apptError;

    // Calculate metrics
    const completed = appointments?.filter((a) => a.status === "completed").length || 0;
    const cancelled = appointments?.filter((a) => a.status === "cancelled").length || 0;
    const noShows = appointments?.filter((a) => a.status === "no_show").length || 0;
    const totalRevenue = appointments
      ?.filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + (parseFloat(a.fee) || 0), 0) || 0;
    const uniquePatients = new Set(appointments?.map((a) => a.patient_id)).size;

    // Get average rating
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("specialist_id", specialistId)
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd);

    const avgRating =
      reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    // Upsert performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from("specialist_performance_metrics")
      .upsert({
        specialist_id: specialistId,
        clinic_id: clinicId || null,
        period_start: periodStart,
        period_end: periodEnd,
        appointments_completed: completed,
        appointments_cancelled: cancelled,
        no_show_count: noShows,
        average_rating: avgRating,
        total_revenue: totalRevenue,
        patient_count: uniquePatients,
      })
      .select()
      .single();

    if (metricsError) throw metricsError;

    // Calculate revenue splits if clinic association exists
    if (clinicId) {
      for (const appointment of appointments || []) {
        if (appointment.status !== "completed") continue;

        const fee = parseFloat(appointment.fee) || 0;
        const clinicPercentage = 30; // Default split
        const specialistPercentage = 70;

        await supabase.from("revenue_splits").insert({
          clinic_id: clinicId,
          specialist_id: specialistId,
          appointment_id: appointment.id,
          service_type: appointment.consultation_type,
          total_amount: fee,
          clinic_percentage: clinicPercentage,
          specialist_percentage: specialistPercentage,
          clinic_amount: (fee * clinicPercentage) / 100,
          specialist_amount: (fee * specialistPercentage) / 100,
          period_start: periodStart,
          period_end: periodEnd,
          status: "pending",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Metrics calculation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
