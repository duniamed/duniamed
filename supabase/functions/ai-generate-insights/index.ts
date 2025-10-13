// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { entity_type, entity_id } = await req.json();

    let data, insights = [];

    // Gather data based on entity type
    if (entity_type === 'clinic') {
      const { data: appointments } = await supabaseClient
        .from('appointments')
        .select('*')
        .eq('clinic_id', entity_id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const total = appointments?.length || 0;
      const completed = appointments?.filter(a => a.status === 'completed').length || 0;
      const noShows = appointments?.filter(a => a.status === 'no_show').length || 0;
      const cancelled = appointments?.filter(a => a.status === 'cancelled').length || 0;

      const noShowRate = total > 0 ? (noShows / total * 100).toFixed(1) : 0;

      if (parseFloat(noShowRate as string) > 15) {
        insights.push({
          insight_type: 'alert',
          insight_text: `No-show rate is ${noShowRate}% (industry average: 15%). Consider implementing automated reminders 24 hours before appointments.`,
          priority: 'high',
          actionable_items: [
            { action: 'Enable SMS reminders', estimated_impact: '30% reduction in no-shows' },
            { action: 'Require deposit for bookings', estimated_impact: '50% reduction in no-shows' }
          ]
        });
      }

      if (completed > 0) {
        insights.push({
          insight_type: 'performance',
          insight_text: `Completed ${completed} appointments in the last 30 days. This is ${completed > 100 ? 'excellent' : 'good'} performance.`,
          priority: 'medium',
          actionable_items: []
        });
      }

      data = { total, completed, noShows, cancelled, noShowRate };
    }

    // Insert insights into database
    for (const insight of insights) {
      await supabaseClient
        .from('analytics_insights_ai')
        .insert({
          entity_type,
          entity_id,
          ...insight,
          confidence_score: 0.85,
          data_snapshot: data,
          status: 'active'
        });
    }

    return new Response(
      JSON.stringify({ success: true, insights_generated: insights.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});