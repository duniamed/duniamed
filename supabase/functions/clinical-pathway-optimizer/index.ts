// UNLIMITED EDGE FUNCTION CAPACITIES: Clinical Pathway Optimizer
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
    const { patientId, diagnosis, currentPathway } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: historicalOutcomes } = await supabase
      .from('care_plans')
      .select('*, outcomes(*)')
      .eq('diagnosis_codes', diagnosis)
      .limit(50);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: 'Optimize clinical pathway based on historical outcomes. Return JSON: { "optimizedPathway": [], "expectedOutcomes": {}, "costSavings": 0, "timeReduction": 0, "qualityImprovement": 0 }'
          },
          {
            role: 'user',
            content: JSON.stringify({ diagnosis, currentPathway, historicalOutcomes })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const optimization = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, optimization }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Pathway optimization error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
