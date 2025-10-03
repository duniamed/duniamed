import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Called when: appointment cancelled, new slot added, specialist updates availability
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { specialist_id, scheduled_at, duration_minutes } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Find all waitlist entries for this specialist
    const { data: waitlistEntries, error: waitlistError } = await supabase
      .from("appointment_waitlist")
      .select(`
        *,
        specialists!inner(
          specialty,
          profiles:user_id(first_name, last_name, email, phone)
        )
      `)
      .eq("specialist_id", specialist_id)
      .eq("status", "waiting")
      .order("created_at", { ascending: true }); // FIFO

    if (waitlistError) throw waitlistError;

    if (!waitlistEntries || waitlistEntries.length === 0) {
      return new Response(
        JSON.stringify({ success: true, matched: 0, message: "No waitlist entries" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Score each waitlist entry based on flexibility
    const scoredEntries = waitlistEntries.map((entry: any) => {
      let score = 0;

      // Base score: earlier in queue = higher priority
      const daysWaiting = Math.floor(
        (Date.now() - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += daysWaiting * 10; // 10 points per day waiting

      // Date flexibility: preferred date match
      if (entry.preferred_date) {
        const slotDate = new Date(scheduled_at).toDateString();
        const prefDate = new Date(entry.preferred_date).toDateString();
        if (slotDate === prefDate) {
          score += 50; // Perfect date match
        } else {
          const daysDiff = Math.abs(
            (new Date(scheduled_at).getTime() - new Date(entry.preferred_date).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (daysDiff <= 3) score += 25; // Within 3 days
        }
      } else {
        score += 30; // Flexible on date (any date works)
      }

      // Time slot flexibility
      if (entry.preferred_time_slot) {
        const slotHour = new Date(scheduled_at).getHours();
        if (entry.preferred_time_slot.includes("morning") && slotHour < 12) {
          score += 20;
        } else if (entry.preferred_time_slot.includes("afternoon") && slotHour >= 12 && slotHour < 17) {
          score += 20;
        } else if (entry.preferred_time_slot.includes("evening") && slotHour >= 17) {
          score += 20;
        }
      } else {
        score += 15; // Flexible on time
      }

      // Urgency notes (contains keywords)
      if (entry.notes) {
        const urgentKeywords = ["urgent", "pain", "emergency", "asap", "soon"];
        const hasUrgent = urgentKeywords.some((keyword) =>
          entry.notes.toLowerCase().includes(keyword)
        );
        if (hasUrgent) score += 40;
      }

      return { ...entry, score };
    });

    // 3. Sort by score (highest first)
    scoredEntries.sort((a, b) => b.score - a.score);

    // 4. Notify top 3 candidates (gives options if first declines)
    const notificationPromises = scoredEntries.slice(0, 3).map(async (entry, index) => {
      const expiresIn = 15 - index * 5; // 15min, 10min, 5min windows

      // BEHAVIORAL PSYCHOLOGY: Loss aversion + Urgency + Scarcity
      const smsMessage = `🚨 SLOT ALERT: Dr. ${entry.specialists.profiles.first_name} ${entry.specialists.profiles.last_name} just became available on ${new Date(scheduled_at).toLocaleDateString()} at ${new Date(scheduled_at).toLocaleTimeString()}. You have ${expiresIn} minutes to book before it's offered to the next person. Don't lose your place in line! Book now: [LINK]`;

      const emailSubject = `⏰ Your Waitlist Slot is Available - Act Fast!`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">⚠️ Don't Miss This Opportunity!</h2>
          
          <p><strong>A slot you've been waiting for is now available:</strong></p>
          
          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #d9534f; margin: 20px 0;">
            <p><strong>Specialist:</strong> Dr. ${entry.specialists.profiles.first_name} ${entry.specialists.profiles.last_name}</p>
            <p><strong>Date:</strong> ${new Date(scheduled_at).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            <p><strong>Time:</strong> ${new Date(scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⏰ Your exclusive booking window expires in ${expiresIn} minutes!</strong><br>
              After that, this slot will be offered to the next person on the waitlist.
            </p>
          </div>
          
          <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;">
              <strong>✓ Match Score: ${entry.score}/100</strong> - This slot matches your preferences!
            </p>
          </div>
          
          <a href="[BOOKING_LINK]" style="display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            🔒 Secure This Slot Now
          </a>
          
          <p style="color: #6c757d; font-size: 12px;">
            You're receiving this because you joined the waitlist for Dr. ${entry.specialists.profiles.last_name}. 
            <a href="[REMOVE_LINK]">Remove me from waitlist</a>
          </p>
        </div>
      `;

      // Send notifications via existing edge functions
      const notificationPromises = [];

      if (entry.specialists.profiles.phone) {
        notificationPromises.push(
          supabase.functions.invoke("send-sms", {
            body: {
              to: entry.specialists.profiles.phone,
              message: smsMessage,
            },
          })
        );
      }

      if (entry.specialists.profiles.email) {
        notificationPromises.push(
          supabase.functions.invoke("send-email", {
            body: {
              to: entry.specialists.profiles.email,
              subject: emailSubject,
              html: emailBody,
            },
          })
        );
      }

      await Promise.all(notificationPromises);

      // Update waitlist entry
      await supabase
        .from("appointment_waitlist")
        .update({
          status: "notified",
          notified_at: new Date().toISOString(),
        })
        .eq("id", entry.id);

      return { patient_id: entry.patient_id, expires_in: expiresIn, score: entry.score };
    });

    const notifications = await Promise.all(notificationPromises);

    return new Response(
      JSON.stringify({
        success: true,
        matched: notifications.length,
        slot: { specialist_id, scheduled_at, duration_minutes },
        notified: notifications,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Waitlist matcher error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
