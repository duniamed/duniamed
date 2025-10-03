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
    const { eventType, severity, message, metadata } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization');
    let userId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Log to database
    const { data: event, error } = await supabase
      .from('monitoring_events')
      .insert({
        event_type: eventType,
        severity: severity,
        message: message,
        metadata: metadata || {},
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Send to New Relic
    const newRelicResponse = await fetch('https://insights-collector.newrelic.com/v1/accounts/YOUR_ACCOUNT_ID/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Insert-Key': Deno.env.get('NEW_RELIC_LICENSE_KEY') || ''
      },
      body: JSON.stringify([{
        eventType: 'DuniaMedEvent',
        severity: severity,
        message: message,
        type: eventType,
        userId: userId,
        timestamp: Date.now(),
        ...metadata
      }])
    });

    if (!newRelicResponse.ok) {
      console.error('New Relic send failed');
    }

    return new Response(
      JSON.stringify({ eventId: event.id, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Monitoring error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
