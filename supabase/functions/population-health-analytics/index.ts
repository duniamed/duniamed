// UNLIMITED EDGE FUNCTION CAPACITIES: Population Health Analytics
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
    const { clinicId, populationSegment, timeframe } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: patients } = await supabase
      .from('profiles')
      .select('*, appointments(*), prescriptions(*)')
      .eq('role', 'patient')
      .limit(1000);

    const { data: chronicConditions } = await supabase
      .from('chronic_conditions')
      .select('*');

    console.log('Analyzing population health:', { clinicId, patientCount: patients?.length });

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
            content: 'Analyze population health trends, risk stratification, care gaps. Return JSON: { "riskStratification": {"high": 0, "medium": 0, "low": 0}, "prevalentConditions": [], "careGaps": [], "costDrivers": [], "qualityMetrics": {}, "interventionOpportunities": [], "predictedAdmissions": [], "socialDeterminants": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ clinicId, populationSegment, timeframe, patients, chronicConditions })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const analytics = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, analytics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Population health analytics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
