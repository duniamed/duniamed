// UNLIMITED EDGE FUNCTION CAPACITIES: AI Insights Generation
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
    const { entityType, entityId, insightType } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    let contextData: any = {};
    if (entityType === 'clinic') {
      const { data: appointments } = await supabase.from('appointments').select('*').eq('clinic_id', entityId).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      const { data: staff } = await supabase.from('clinic_staff').select('*').eq('clinic_id', entityId);
      contextData = { appointments, staff };
    } else if (entityType === 'specialist') {
      const { data: appointments } = await supabase.from('appointments').select('*').eq('specialist_id', entityId).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      const { data: liveStatus } = await supabase.from('specialist_live_status').select('*').eq('specialist_id', entityId).single();
      contextData = { appointments, liveStatus };
    } else if (entityType === 'patient') {
      const { data: appointments } = await supabase.from('appointments').select('*, prescriptions(*)').eq('patient_id', entityId);
      contextData = { appointments };
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: `Generate actionable insights for ${entityType}. Return JSON: { "insights": [{"title": "", "description": "", "priority": "high|medium|low", "actionItems": []}], "summary": "" }` },
          { role: 'user', content: JSON.stringify({ entityType, insightType, data: contextData }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const generatedInsights = JSON.parse(aiData.choices[0].message.content);

    const storedInsights = [];
    for (const insight of generatedInsights.insights) {
      const { data } = await supabase.from('analytics_insights_ai').insert({
        entity_type: entityType,
        entity_id: entityId,
        insight_type: insightType,
        insight_text: insight.description,
        data_snapshot: contextData,
        actionable_items: insight.actionItems,
        priority: insight.priority,
        status: 'active'
      }).select().single();
      storedInsights.push(data);
    }

    return new Response(JSON.stringify({ success: true, summary: generatedInsights.summary, insights: storedInsights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Insight generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
