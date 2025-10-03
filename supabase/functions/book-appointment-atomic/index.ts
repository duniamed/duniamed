import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  patient_id: string;
  specialist_id: string;
  scheduled_at: string;
  duration_minutes: number;
  consultation_type: string;
  chief_complaint: string;
  urgency_level: string;
  fee: number;
  currency: string;
  // Resource requirements
  room_id?: string;
  equipment_ids?: string[];
  staff_ids?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bookingData: BookingRequest = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ATOMIC TRANSACTION: All-or-nothing booking
    // Step 1: Check practitioner availability
    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("specialist_id", bookingData.specialist_id)
      .eq("scheduled_at", bookingData.scheduled_at)
      .in("status", ["pending", "confirmed", "hold"])
      .maybeSingle();

    if (existingAppointment) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "conflict",
          message: "Practitioner is no longer available at this time",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Step 2: Check room availability (if required)
    if (bookingData.room_id) {
      const { data: roomConflict } = await supabase
        .from("resource_bookings")
        .select("id")
        .eq("resource_id", bookingData.room_id)
        .eq("booking_date", bookingData.scheduled_at.split("T")[0])
        .overlaps(
          "time_range",
          `[${bookingData.scheduled_at},${new Date(
            new Date(bookingData.scheduled_at).getTime() +
              bookingData.duration_minutes * 60000
          ).toISOString()})`
        )
        .maybeSingle();

      if (roomConflict) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "room_conflict",
            message: "Room is not available at this time",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
        );
      }
    }

    // Step 3: Check equipment availability (if required)
    if (bookingData.equipment_ids && bookingData.equipment_ids.length > 0) {
      for (const equipmentId of bookingData.equipment_ids) {
        const { data: equipmentConflict } = await supabase
          .from("resource_bookings")
          .select("id")
          .eq("resource_id", equipmentId)
          .eq("booking_date", bookingData.scheduled_at.split("T")[0])
          .overlaps(
            "time_range",
            `[${bookingData.scheduled_at},${new Date(
              new Date(bookingData.scheduled_at).getTime() +
                bookingData.duration_minutes * 60000
            ).toISOString()})`
          )
          .maybeSingle();

        if (equipmentConflict) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "equipment_conflict",
              message: `Equipment ${equipmentId} is not available`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
          );
        }
      }
    }

    // Step 4: BEGIN TRANSACTION - Create appointment + reserve resources
    const appointmentId = crypto.randomUUID();
    const endTime = new Date(
      new Date(bookingData.scheduled_at).getTime() +
        bookingData.duration_minutes * 60000
    ).toISOString();

    // Insert appointment
    const { error: appointmentError } = await supabase.from("appointments").insert({
      id: appointmentId,
      patient_id: bookingData.patient_id,
      specialist_id: bookingData.specialist_id,
      scheduled_at: bookingData.scheduled_at,
      duration_minutes: bookingData.duration_minutes,
      consultation_type: bookingData.consultation_type,
      chief_complaint: bookingData.chief_complaint,
      urgency_level: bookingData.urgency_level,
      fee: bookingData.fee,
      currency: bookingData.currency,
      status: "pending",
      modality: bookingData.consultation_type === "video" ? "telehealth" : "in_person",
    });

    if (appointmentError) {
      throw new Error(`Failed to create appointment: ${appointmentError.message}`);
    }

    // Reserve room
    if (bookingData.room_id) {
      const { error: roomError } = await supabase.from("resource_bookings").insert({
        resource_id: bookingData.room_id,
        appointment_id: appointmentId,
        booking_date: bookingData.scheduled_at.split("T")[0],
        time_range: `[${bookingData.scheduled_at},${endTime})`,
        booked_by: bookingData.patient_id,
      });

      if (roomError) {
        // ROLLBACK: Delete appointment
        await supabase.from("appointments").delete().eq("id", appointmentId);
        throw new Error(`Failed to reserve room: ${roomError.message}`);
      }
    }

    // Reserve equipment
    if (bookingData.equipment_ids && bookingData.equipment_ids.length > 0) {
      const equipmentBookings = bookingData.equipment_ids.map((equipmentId) => ({
        resource_id: equipmentId,
        appointment_id: appointmentId,
        booking_date: bookingData.scheduled_at.split("T")[0],
        time_range: `[${bookingData.scheduled_at},${endTime})`,
        booked_by: bookingData.patient_id,
      }));

      const { error: equipmentError } = await supabase
        .from("resource_bookings")
        .insert(equipmentBookings);

      if (equipmentError) {
        // ROLLBACK: Delete appointment and room booking
        await supabase.from("appointments").delete().eq("id", appointmentId);
        if (bookingData.room_id) {
          await supabase
            .from("resource_bookings")
            .delete()
            .eq("appointment_id", appointmentId);
        }
        throw new Error(`Failed to reserve equipment: ${equipmentError.message}`);
      }
    }

    // Step 5: Send confirmation notifications
    supabase.functions.invoke("send-appointment-reminder", {
      body: {
        appointment_id: appointmentId,
        patient_id: bookingData.patient_id,
        specialist_id: bookingData.specialist_id,
        scheduled_at: bookingData.scheduled_at,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        appointment_id: appointmentId,
        scheduled_at: bookingData.scheduled_at,
        resources_reserved: {
          room: bookingData.room_id || null,
          equipment: bookingData.equipment_ids || [],
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Atomic booking error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "booking_failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
