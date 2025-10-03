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
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find tokens expiring within 1 hour
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    const { data: expiringTokens, error: fetchError } = await supabase
      .from("calendar_providers")
      .select("*")
      .lt("token_expires_at", oneHourFromNow)
      .eq("sync_enabled", true);

    if (fetchError) throw fetchError;

    console.log(`Found ${expiringTokens?.length || 0} tokens to refresh`);

    const results = [];

    for (const token of expiringTokens || []) {
      try {
        await supabase
          .from("calendar_providers")
          .update({ last_refresh_attempt: new Date().toISOString() })
          .eq("id", token.id);

        let refreshResponse;
        
        if (token.provider === "google") {
          // Google token refresh
          refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
              client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
              refresh_token: token.refresh_token || "",
              grant_type: "refresh_token",
            }),
          });
        } else if (token.provider === "outlook") {
          // Microsoft token refresh
          refreshResponse = await fetch(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: Deno.env.get("MICROSOFT_CLIENT_ID") || "",
                client_secret: Deno.env.get("MICROSOFT_CLIENT_SECRET") || "",
                refresh_token: token.refresh_token || "",
                grant_type: "refresh_token",
              }),
            }
          );
        } else {
          throw new Error(`Unsupported provider: ${token.provider}`);
        }

        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text();
          throw new Error(`Token refresh failed: ${errorText}`);
        }

        const refreshData = await refreshResponse.json();

        // Update token in database
        const newExpiry = new Date(
          Date.now() + (refreshData.expires_in || 3600) * 1000
        ).toISOString();

        await supabase
          .from("calendar_providers")
          .update({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token || token.refresh_token,
            token_expires_at: newExpiry,
            refresh_count: (token.refresh_count || 0) + 1,
            failure_count: 0,
            last_sync_at: new Date().toISOString(),
          })
          .eq("id", token.id);

        // Log success
        await supabase.from("calendar_sync_logs").insert({
          user_id: token.user_id,
          provider: token.provider,
          action: "token_refreshed",
          status: "success",
        });

        results.push({
          user_id: token.user_id,
          provider: token.provider,
          status: "success",
        });

        console.log(`Successfully refreshed token for user ${token.user_id}`);
      } catch (error: any) {
        console.error(`Failed to refresh token for user ${token.user_id}:`, error);

        // Update failure count
        await supabase
          .from("calendar_providers")
          .update({
            failure_count: (token.failure_count || 0) + 1,
          })
          .eq("id", token.id);

        // Log failure
        await supabase.from("calendar_sync_logs").insert({
          user_id: token.user_id,
          provider: token.provider,
          action: "token_refresh_failed",
          status: "error",
          error_message: error.message,
        });

        results.push({
          user_id: token.user_id,
          provider: token.provider,
          status: "error",
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
