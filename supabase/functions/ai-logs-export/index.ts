// AI Logs Export for Analytics
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { start_date, end_date, context, format = 'json', limit = 1000 } = await req.json();

    console.log(`Exporting AI logs: ${start_date} to ${end_date}`);

    let query = supabase
      .from('ai_symptom_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (start_date) {
      query = query.gte('timestamp', start_date);
    }
    if (end_date) {
      query = query.lte('timestamp', end_date);
    }
    if (context) {
      query = query.eq('context', context);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    // Format based on requested type
    if (format === 'csv') {
      const headers = ['timestamp', 'context', 'user_role', 'latency_ms', 'geo_region', 'output_summary'];
      const csv = [
        headers.join(','),
        ...logs.map(log => 
          headers.map(h => {
            const val = log[h];
            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(',')
        )
      ].join('\n');

      return new Response(csv, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="ai-logs-${start_date}-${end_date}.csv"`
        }
      });
    }

    // JSON format
    return new Response(JSON.stringify({ success: true, logs, count: logs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('AI logs export error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});