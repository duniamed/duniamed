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
    const { userId, provider, authCode } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Exchange auth code for tokens (simplified - actual OAuth flow)
    const tokens = {
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      expiry: new Date(Date.now() + 3600000).toISOString(),
    };

    await supabase.from("calendar_sync_tokens").upsert({
      user_id: userId,
      provider: provider,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_expiry: tokens.expiry,
      sync_enabled: true,
    });

    // Fetch user appointments
    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .or(`patient_id.eq.${userId},specialist_id.in.(SELECT id FROM specialists WHERE user_id = '${userId}')`)
      .gte("scheduled_at", new Date().toISOString());

    // Sync to external calendar (mocked)
    const syncedCount = appointments?.length || 0;
    console.log(`Synced ${syncedCount} appointments to ${provider}`);

    await supabase
      .from("calendar_sync_tokens")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", provider);

    return new Response(
      JSON.stringify({ success: true, syncedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Calendar sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});