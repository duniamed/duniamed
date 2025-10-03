import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * C16 PRICING - Price Change Notifier
 * Sends 30-day advance notice of price changes to affected users
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

    console.log('Checking for pending price change notices...');

    // Find notices that need to be sent (30 days before effective date)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: pendingNotices, error: fetchError } = await supabase
      .from('price_change_notices')
      .select(`
        *,
        subscription_tiers!inner(tier_name)
      `)
      .is('notice_sent_at', null)
      .lte('effective_date', thirtyDaysFromNow.toISOString());

    if (fetchError) {
      console.error('Error fetching notices:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingNotices?.length || 0} pending notices`);

    let notificationsSent = 0;

    for (const notice of pendingNotices || []) {
      try {
        // Find affected users
        const { data: affectedUsers, error: usersError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('tier_id', notice.affected_tier_id)
          .eq('status', 'active');

        if (usersError) {
          console.error('Error fetching affected users:', usersError);
          continue;
        }

        // Send notifications to each affected user
        for (const userSub of affectedUsers || []) {
          try {
            await supabase.functions.invoke('send-multi-channel-notification', {
              body: {
                user_id: userSub.user_id,
                message: `Important: Your ${(notice as any).subscription_tiers.tier_name} subscription price will change from $${notice.old_price} to $${notice.new_price} effective ${new Date(notice.effective_date).toLocaleDateString()}. ${notice.reason || ''}`,
                priority: 'high',
                message_type: 'price_change_notice'
              }
            });

            notificationsSent++;
          } catch (notifyError) {
            console.error(`Failed to notify user ${userSub.user_id}:`, notifyError);
          }
        }

        // Mark notice as sent
        await supabase
          .from('price_change_notices')
          .update({ notice_sent_at: new Date().toISOString() })
          .eq('id', notice.id);

        console.log(`Sent ${affectedUsers?.length || 0} notifications for notice ${notice.id}`);
      } catch (noticeError) {
        console.error(`Error processing notice ${notice.id}:`, noticeError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notices_processed: pendingNotices?.length || 0,
        notifications_sent: notificationsSent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in notify-price-change:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
