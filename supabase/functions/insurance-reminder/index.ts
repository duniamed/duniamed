import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find verifications expiring in 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringVerifications, error: fetchError } = await supabaseClient
      .from('insurance_verifications' as any)
      .select(`
        *,
        specialists!insurance_verifications_specialist_id_fkey (
          user_id,
          profiles:specialists_user_id_fkey (
            email,
            first_name
          )
        )
      `)
      .eq('is_active', true)
      .lte('expires_at', thirtyDaysFromNow.toISOString())
      .gte('expires_at', new Date().toISOString());

    if (fetchError) throw fetchError;

    console.log(`Found ${expiringVerifications?.length || 0} expiring verifications`);

    // Send reminders
    for (const verification of expiringVerifications || []) {
      const specialist = verification.specialists;
      if (!specialist?.user_id) continue;

      // Send notification
      await supabaseClient.functions.invoke('send-notification', {
        body: {
          userId: specialist.user_id,
          type: 'insurance_expiring',
          title: 'Insurance Verification Expiring',
          message: `Your insurance verification for ${verification.payer_name} expires on ${new Date(verification.expires_at).toLocaleDateString()}. Please renew to continue accepting patients.`,
          data: {
            verificationId: verification.id,
            payerName: verification.payer_name
          }
        }
      });

      console.log(`Sent reminder to ${specialist.user_id} for ${verification.payer_name}`);
    }

    // Find verifications that haven't been checked in 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: staleVerifications, error: staleError } = await supabaseClient
      .from('insurance_verifications' as any)
      .select(`
        *,
        specialists!insurance_verifications_specialist_id_fkey (
          user_id
        )
      `)
      .eq('is_active', true)
      .lte('last_checked', ninetyDaysAgo.toISOString());

    if (staleError) throw staleError;

    console.log(`Found ${staleVerifications?.length || 0} stale verifications`);

    for (const verification of staleVerifications || []) {
      const specialist = verification.specialists;
      if (!specialist?.user_id) continue;

      await supabaseClient.functions.invoke('send-notification', {
        body: {
          userId: specialist.user_id,
          type: 'insurance_check_required',
          title: 'Insurance Verification Check Required',
          message: `Your insurance panel for ${verification.payer_name} hasn't been verified in 90 days. Please review and update.`,
          data: {
            verificationId: verification.id
          }
        }
      });

      console.log(`Sent check reminder to ${specialist.user_id}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        expiring: expiringVerifications?.length || 0,
        stale: staleVerifications?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Insurance reminder error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
