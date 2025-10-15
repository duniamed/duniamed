// UNLIMITED EDGE FUNCTION CAPACITIES: Medical Equipment Maintenance AI
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
    const { clinicId, equipmentId, usageData, maintenanceHistory } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: equipment } = await supabase
      .from('clinic_resources')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('resource_type', 'equipment');

    console.log('Analyzing equipment maintenance:', { clinicId, equipmentCount: equipment?.length });

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
            content: 'Predict equipment failures and optimize maintenance schedules. Return JSON: { "predictedFailures": [{"equipmentId": "", "probability": 0-1, "timeframe": "", "impact": ""}], "maintenanceSchedule": [], "costOptimization": {}, "replacementRecommendations": [], "utilizationMetrics": {}, "complianceStatus": [], "calibrationAlerts": [], "warrantyStatus": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ clinicId, equipmentId, usageData, maintenanceHistory, equipment })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const maintenanceInsights = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, maintenanceInsights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Equipment maintenance AI error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
