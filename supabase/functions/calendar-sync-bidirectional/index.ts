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
    const { userId, provider } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get provider tokens
    const { data: providerData, error: providerError } = await supabase
      .from("calendar_providers")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", provider)
      .single();

    if (providerError || !providerData) {
      throw new Error("Calendar provider not connected");
    }

    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(providerData.token_expires_at);
    
    if (now >= expiresAt) {
      // Refresh token logic here
      console.log("Token expired, refreshing...");
    }

    // Get user appointments
    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", userId)
      .gte("scheduled_at", new Date().toISOString());

    let syncedCount = 0;

    if (provider === "google") {
      // Sync to Google Calendar
      for (const apt of appointments || []) {
        const event = {
          summary: `Appointment - ${apt.chief_complaint || 'Healthcare Visit'}`,
          description: `Consultation Type: ${apt.consultation_type}`,
          start: {
            dateTime: apt.scheduled_at,
            timeZone: 'UTC'
          },
          end: {
            dateTime: new Date(new Date(apt.scheduled_at).getTime() + apt.duration_minutes * 60000).toISOString(),
            timeZone: 'UTC'
          }
        };

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${providerData.access_token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(event)
          }
        );

        if (response.ok) {
          syncedCount++;
        }
      }
    } else if (provider === "outlook") {
      // Sync to Outlook Calendar
      for (const apt of appointments || []) {
        const event = {
          subject: `Appointment - ${apt.chief_complaint || 'Healthcare Visit'}`,
          body: {
            contentType: "HTML",
            content: `Consultation Type: ${apt.consultation_type}`
          },
          start: {
            dateTime: apt.scheduled_at,
            timeZone: 'UTC'
          },
          end: {
            dateTime: new Date(new Date(apt.scheduled_at).getTime() + apt.duration_minutes * 60000).toISOString(),
            timeZone: 'UTC'
          }
        };

        const response = await fetch(
          "https://graph.microsoft.com/v1.0/me/events",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${providerData.access_token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(event)
          }
        );

        if (response.ok) {
          syncedCount++;
        }
      }
    }

    // Update last sync time
    await supabase
      .from("calendar_providers")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", provider);

    return new Response(
      JSON.stringify({ success: true, syncedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});