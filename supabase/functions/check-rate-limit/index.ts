import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitCheck {
  endpoint: string;
  max_requests?: number;
  window_duration?: string; // e.g., '1 hour', '1 minute'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    let identifier = clientIP;
    let user = null;

    // Try to get user if authenticated
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser } } = await supabaseClient.auth.getUser(token);
      if (authUser) {
        user = authUser;
        identifier = authUser.id;
      }
    }

    const { endpoint, max_requests = 100, window_duration = '1 hour' }: RateLimitCheck = await req.json();

    const now = new Date();
    const windowStart = new Date(now.getTime());

    // Check existing rate limit entry
    const { data: existingLimit } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', new Date(now.getTime() - 3600000).toISOString()) // Last hour
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingLimit) {
      const windowEnd = new Date(
        new Date(existingLimit.window_start).getTime() + 
        (existingLimit.window_duration ? parseInt(existingLimit.window_duration.split(' ')[0]) * 3600000 : 3600000)
      );

      if (now < windowEnd) {
        // Within the same window
        if (existingLimit.request_count >= existingLimit.max_requests) {
          // Rate limit exceeded
          const retryAfter = Math.ceil((windowEnd.getTime() - now.getTime()) / 1000);
          
          return new Response(
            JSON.stringify({
              success: false,
              rate_limited: true,
              message: 'Rate limit exceeded',
              retry_after_seconds: retryAfter,
              limit: existingLimit.max_requests,
              remaining: 0
            }),
            { 
              status: 429,
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'Retry-After': retryAfter.toString()
              }
            }
          );
        }

        // Increment request count
        await supabaseClient
          .from('rate_limits')
          .update({ 
            request_count: existingLimit.request_count + 1,
            updated_at: now.toISOString()
          })
          .eq('id', existingLimit.id);

        return new Response(
          JSON.stringify({
            success: true,
            rate_limited: false,
            limit: existingLimit.max_requests,
            remaining: existingLimit.max_requests - existingLimit.request_count - 1
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create new rate limit window
    await supabaseClient
      .from('rate_limits')
      .insert({
        identifier,
        endpoint,
        request_count: 1,
        window_start: now.toISOString(),
        window_duration: window_duration,
        max_requests
      });

    return new Response(
      JSON.stringify({
        success: true,
        rate_limited: false,
        limit: max_requests,
        remaining: max_requests - 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Rate limit check error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});