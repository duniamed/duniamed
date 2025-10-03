import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * C15 PRIVACY - Generate Data Use Summary
 * Creates annual summaries of data access and sharing for users
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

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating data summary for user: ${user_id}`);

    // Calculate date range (last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Fetch access logs for the period
    const { data: accessLogs, error: logsError } = await supabase
      .from('data_access_logs')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', oneYearAgo.toISOString());

    if (logsError) {
      console.error('Error fetching access logs:', logsError);
      throw logsError;
    }

    // Fetch document shares to identify who data was shared with
    const { data: shares, error: sharesError } = await supabase
      .from('document_shares')
      .select('shared_with, purpose, created_at')
      .eq('shared_by', user_id)
      .gte('created_at', oneYearAgo.toISOString());

    if (sharesError) {
      console.error('Error fetching shares:', sharesError);
      throw sharesError;
    }

    // Aggregate data
    const sharedWith = shares?.map(s => ({
      specialist_id: s.shared_with,
      purpose: s.purpose,
      date: s.created_at
    })) || [];

    const secondaryUses = accessLogs
      ?.filter(log => log.purpose?.includes('research') || log.purpose?.includes('analytics'))
      .map(log => ({
        purpose: log.purpose,
        date: log.created_at,
        resource_type: log.resource_type
      })) || [];

    // Create summary record
    const { data: summary, error: summaryError } = await supabase
      .from('data_use_summaries')
      .insert({
        user_id: user_id,
        summary_period: `${oneYearAgo.getFullYear()}-${new Date().getFullYear()}`,
        access_count: accessLogs?.length || 0,
        shared_with: sharedWith,
        secondary_uses: secondaryUses
      })
      .select()
      .single();

    if (summaryError) {
      console.error('Error creating summary:', summaryError);
      throw summaryError;
    }

    console.log(`Summary generated: ${summary.id}`);

    // Send notification to user
    await supabase.functions.invoke('send-multi-channel-notification', {
      body: {
        user_id: user_id,
        message: 'Your annual data use summary is now available in your Privacy Center',
        priority: 'medium',
        message_type: 'data_summary_ready'
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        summary_id: summary.id,
        access_count: accessLogs?.length || 0,
        shares_count: sharedWith.length,
        secondary_uses_count: secondaryUses.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-data-summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
