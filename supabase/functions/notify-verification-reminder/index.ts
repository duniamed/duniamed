import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * C11 FRESHNESS - Verification Reminder Edge Function
 * Sends reminders to specialists about pending verifications
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting verification reminder check...');

    // Find specialists with stale verifications (>90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: staleSpecialists, error: fetchError } = await supabase
        .from('specialists')
        .select(`
          id,
          user_id,
          profiles!inner(email, first_name, last_name)
        `)
        .not('profiles.email', 'is', null)
        .or(`verification_last_checked.lt.${ninetyDaysAgo.toISOString()},verification_last_checked.is.null`);

      if (fetchError) {
        console.error('Error fetching specialists:', fetchError);
        throw fetchError;
      }

      console.log(`Found ${staleSpecialists?.length || 0} specialists needing verification reminders`);

      // Send reminders via multi-channel notification
      for (const specialist of staleSpecialists || []) {
        try {
          const profile = specialist.profiles as any;
          await supabase.functions.invoke('send-multi-channel-notification', {
            body: {
              user_id: specialist.user_id,
              message: `Hi ${profile?.first_name || 'there'}, your profile verification is due. Please update your credentials to maintain your verified status.`,
              priority: 'high',
              message_type: 'verification_reminder'
            }
          });

          console.log(`Reminder sent to specialist ${specialist.id}`);
        } catch (notifyError) {
          console.error(`Failed to send reminder to ${specialist.id}:`, notifyError);
        }
      }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: staleSpecialists?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in notify-verification-reminder:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
