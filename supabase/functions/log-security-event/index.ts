import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityEvent {
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const eventData: SecurityEvent = await req.json();

    // Get client IP and user agent
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent');

    // Insert security audit log
    const { error: insertError } = await supabaseClient
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action: eventData.action,
        resource_type: eventData.resource_type,
        resource_id: eventData.resource_id,
        metadata: eventData.metadata || {},
        ip_address: clientIP,
        user_agent: userAgent,
        severity: eventData.severity || 'medium'
      });

    if (insertError) {
      console.error('Error logging security event:', insertError);
      throw insertError;
    }

    console.log(`Security event logged: ${eventData.action} on ${eventData.resource_type} by user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Security event logged' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Security logging error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});