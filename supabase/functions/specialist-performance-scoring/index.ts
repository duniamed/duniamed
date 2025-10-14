// UNLIMITED EDGE FUNCTION CAPACITIES: Specialist Performance Scoring
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
    const { specialist_id, period_days } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: metrics } = await supabase.rpc('calculate_specialist_metrics', {
      p_specialist_id: specialist_id,
      p_period_days: period_days || 30
    });

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Calculate comprehensive specialist performance score. Return JSON with:
- overall_score: 0-100 performance score
- category_scores: {quality, efficiency, patient_satisfaction, revenue}
- strengths: Top performing areas
- improvement_areas: Areas needing attention
- benchmarks: Comparison to peers
- recommendations: Actionable improvement steps`
          },
          {
            role: 'user',
            content: JSON.stringify(metrics)
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const performance_score = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, performance_score }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Performance scoring error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
