// UNLIMITED EDGE FUNCTION CAPACITIES: AI Treatment Effectiveness Analysis
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
    const { specialistId, patientId, timeframe } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    let query = supabase.from('appointments').select('*, prescriptions(*), soap_notes(*)').eq('status', 'completed');
    if (specialistId) query = query.eq('specialist_id', specialistId);
    if (patientId) query = query.eq('patient_id', patientId);
    const { data: appointments } = await query;

    console.log(`Analyzing ${appointments?.length || 0} completed appointments`);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Analyze treatment effectiveness. Return JSON: { "effectivenessScore": 0-100, "insights": [], "recommendations": [], "trends": {} }' },
          { role: 'user', content: JSON.stringify({ appointments, timeframe }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('analytics_insights_ai').insert({
      entity_type: specialistId ? 'specialist' : 'patient',
      entity_id: specialistId || patientId,
      insight_type: 'treatment_effectiveness',
      insight_text: JSON.stringify(analysis.insights),
      confidence_score: analysis.effectivenessScore / 100,
      data_snapshot: analysis,
      actionable_items: analysis.recommendations,
      priority: analysis.effectivenessScore < 60 ? 'high' : 'medium'
    });

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Treatment analysis error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
