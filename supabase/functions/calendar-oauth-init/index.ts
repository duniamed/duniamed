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
    const { provider } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const callbackUrl = `${supabaseUrl}/functions/v1/calendar-oauth-callback`;

    let authUrl: string;
    
    if (provider === "google") {
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      if (!clientId) {
        throw new Error("Google Client ID not configured");
      }
      
      const scopes = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events"
      ].join(" ");
      
      const state = crypto.randomUUID();
      
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: scopes,
        access_type: "offline",
        prompt: "consent",
        state: state
      })}`;
    } else if (provider === "outlook") {
      const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
      if (!clientId) {
        throw new Error("Microsoft Client ID not configured");
      }
      
      const scopes = [
        "Calendars.ReadWrite",
        "offline_access"
      ].join(" ");
      
      const state = crypto.randomUUID();
      
      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: scopes,
        state: state
      })}`;
    } else {
      throw new Error("Unsupported provider");
    }

    return new Response(
      JSON.stringify({ authUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("OAuth init error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});