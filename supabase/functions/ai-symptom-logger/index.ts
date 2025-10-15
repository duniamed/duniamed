// AI Symptom Checker Logger
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

    const { request_id, context, inputs, outputs, retrieved_sources, citations, latency_ms, user_role, geo_region } = await req.json();

    console.log(`Logging AI symptom interaction: ${request_id}`);

    // Hash inputs for privacy
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(inputs));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputs_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Extract schema without sensitive data
    const inputs_schema = {
      fields: Object.keys(inputs),
      types: Object.entries(inputs).reduce((acc, [key, val]) => {
        acc[key] = typeof val;
        return acc;
      }, {} as Record<string, string>)
    };

    const output_schema = {
      fields: Object.keys(outputs),
      types: Object.entries(outputs).reduce((acc, [key, val]) => {
        acc[key] = typeof val;
        return acc;
      }, {} as Record<string, string>)
    };

    // Log to database
    const { data: log, error } = await supabase
      .from('ai_symptom_logs')
      .insert({
        request_id,
        context,
        inputs_hash,
        inputs_schema,
        retrieved_sources,
        output_summary: outputs.summary || outputs.diagnosis || '',
        output_schema,
        citations,
        flags: outputs.flags || {},
        latency_ms,
        evaluator_scores: outputs.evaluator_scores || {},
        user_role,
        geo_region
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, log_id: log.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('AI symptom logger error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});