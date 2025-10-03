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
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error("No authorization code received");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Determine provider from referer or state
    // For demo, we'll try both providers
    let tokens: any = null;
    let provider = "google";

    try {
      // Try Google first
      const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
      
      if (googleClientId && googleClientSecret) {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            client_id: googleClientId,
            client_secret: googleClientSecret,
            redirect_uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/calendar-oauth-callback`,
            grant_type: "authorization_code"
          })
        });

        if (tokenResponse.ok) {
          tokens = await tokenResponse.json();
          provider = "google";
        }
      }
    } catch (e) {
      console.log("Not Google, trying Microsoft:", e);
    }

    if (!tokens) {
      // Try Microsoft
      const msClientId = Deno.env.get("MICROSOFT_CLIENT_ID");
      const msClientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");
      
      if (msClientId && msClientSecret) {
        const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: msClientId,
            client_secret: msClientSecret,
            redirect_uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/calendar-oauth-callback`,
            grant_type: "authorization_code"
          })
        });

        tokens = await tokenResponse.json();
        provider = "outlook";
      }
    }

    if (!tokens) {
      throw new Error("Failed to exchange code for tokens");
    }

    // Get user from session (you'd need to pass user_id in state in production)
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      throw new Error("No auth token");
    }

    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error("User not found");
    }

    // Store tokens
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
    
    await supabase.from("calendar_providers").upsert({
      user_id: user.id,
      provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt.toISOString(),
      sync_enabled: true
    });

    // Redirect back to app
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: `${Deno.env.get("SUPABASE_URL")}/calendar-sync?success=true&provider=${provider}`
      }
    });
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: `${Deno.env.get("SUPABASE_URL")}/calendar-sync?error=${encodeURIComponent(error.message)}`
      }
    });
  }
});