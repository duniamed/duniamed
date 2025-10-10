import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // This function runs on a schedule (pg_cron) to automatically set specialists
    // offline if they haven't had activity in the last 30 minutes

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Get specialists who are marked online but haven't had recent activity
    const { data: inactiveSpecialists, error: fetchError } = await supabase
      .from('specialists')
      .select('id, user_id')
      .eq('is_online', true);

    if (fetchError) {
      throw fetchError;
    }

    const specialistsToDisable: string[] = [];

    // Check activity for each specialist
    for (const specialist of inactiveSpecialists || []) {
      const { data: recentActivity } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', specialist.user_id)
        .gte('created_at', thirtyMinutesAgo)
        .limit(1);

      // If no recent activity, mark for offline status
      if (!recentActivity || recentActivity.length === 0) {
        specialistsToDisable.push(specialist.id);
      }
    }

    // Update specialists to offline
    if (specialistsToDisable.length > 0) {
      const { error: updateError } = await supabase
        .from('specialists')
        .update({ is_online: false })
        .in('id', specialistsToDisable);

      if (updateError) {
        throw updateError;
      }

      console.log(`Set ${specialistsToDisable.length} specialists offline due to inactivity`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: specialistsToDisable.length,
        message: `Processed ${inactiveSpecialists?.length || 0} online specialists, set ${specialistsToDisable.length} offline`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto update status error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
