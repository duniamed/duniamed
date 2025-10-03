import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { provider, code, redirect_uri } = await req.json();

    console.log(`OAuth RPM connect for provider: ${provider}`);

    // Terra Health API
    if (provider === 'terra') {
      const TERRA_DEV_ID = Deno.env.get('TERRA_DEV_ID');
      const TERRA_API_KEY = Deno.env.get('TERRA_API_KEY');

      if (!TERRA_DEV_ID || !TERRA_API_KEY) {
        throw new Error('Terra credentials not configured');
      }

      const tokenResponse = await fetch('https://api.tryterra.co/v2/auth/authenticate', {
        method: 'POST',
        headers: {
          'dev-id': TERRA_DEV_ID,
          'x-api-key': TERRA_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Terra authentication failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();

      // Store tokens in rpm_device_auth
      const { error: dbError } = await supabase
        .from('rpm_device_auth')
        .upsert({
          user_id: user.id,
          provider: 'terra',
          access_token: tokenData.user.user_id,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          scopes: ['activity', 'body', 'sleep', 'nutrition'],
          is_active: true,
        }, { onConflict: 'user_id,provider' });

      if (dbError) throw dbError;

      return new Response(JSON.stringify({
        success: true,
        provider: 'terra',
        user_id: tokenData.user.user_id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fitbit OAuth
    if (provider === 'fitbit') {
      const FITBIT_CLIENT_ID = Deno.env.get('FITBIT_CLIENT_ID');
      const FITBIT_CLIENT_SECRET = Deno.env.get('FITBIT_CLIENT_SECRET');

      if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET) {
        throw new Error('Fitbit credentials not configured');
      }

      const basicAuth = btoa(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`);

      const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Fitbit authentication failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();

      const { error: dbError } = await supabase
        .from('rpm_device_auth')
        .upsert({
          user_id: user.id,
          provider: 'fitbit',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          scopes: tokenData.scope.split(' '),
          is_active: true,
        }, { onConflict: 'user_id,provider' });

      if (dbError) throw dbError;

      return new Response(JSON.stringify({
        success: true,
        provider: 'fitbit',
        user_id: tokenData.user_id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Withings OAuth
    if (provider === 'withings') {
      const WITHINGS_CLIENT_ID = Deno.env.get('WITHINGS_CLIENT_ID');
      const WITHINGS_CLIENT_SECRET = Deno.env.get('WITHINGS_CLIENT_SECRET');

      if (!WITHINGS_CLIENT_ID || !WITHINGS_CLIENT_SECRET) {
        throw new Error('Withings credentials not configured');
      }

      const tokenResponse = await fetch('https://wbsapi.withings.net/v2/oauth2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'requesttoken',
          client_id: WITHINGS_CLIENT_ID,
          client_secret: WITHINGS_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Withings authentication failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();

      if (tokenData.status !== 0) {
        throw new Error(`Withings error: ${tokenData.error}`);
      }

      const { error: dbError } = await supabase
        .from('rpm_device_auth')
        .upsert({
          user_id: user.id,
          provider: 'withings',
          access_token: tokenData.body.access_token,
          refresh_token: tokenData.body.refresh_token,
          token_expires_at: new Date(Date.now() + tokenData.body.expires_in * 1000).toISOString(),
          scopes: ['user.info', 'user.metrics', 'user.activity'],
          is_active: true,
        }, { onConflict: 'user_id,provider' });

      if (dbError) throw dbError;

      return new Response(JSON.stringify({
        success: true,
        provider: 'withings',
        user_id: tokenData.body.userid,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unsupported provider: ${provider}`);

  } catch (error: any) {
    console.error('OAuth RPM connect error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});