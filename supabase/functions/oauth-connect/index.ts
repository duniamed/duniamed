import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integration_type, clinic_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For now, return placeholder OAuth URLs
    // In production, implement actual OAuth flows for each platform
    let authUrl = '';
    const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;

    switch (integration_type) {
      case 'google_business':
        // Google Business Profile API OAuth
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/business.manage&state=${clinic_id}`;
        break;
      case 'instagram':
        // Instagram Basic Display API OAuth
        authUrl = `https://api.instagram.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code&state=${clinic_id}`;
        break;
      case 'facebook':
        // Facebook OAuth
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_manage_posts,pages_read_engagement&state=${clinic_id}`;
        break;
      case 'twitter':
        // Twitter OAuth 2.0
        authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read&state=${clinic_id}`;
        break;
      default:
        throw new Error('Unsupported integration type');
    }

    console.log('Generated OAuth URL for', integration_type, ':', authUrl);

    return new Response(
      JSON.stringify({ 
        authUrl,
        message: 'OAuth flow initiated. In production, configure API credentials for each platform.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('OAuth connect error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
