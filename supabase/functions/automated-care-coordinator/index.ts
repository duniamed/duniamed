// UNLIMITED EDGE FUNCTION CAPACITIES: Automated Care Coordinator
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
    const { patientId, carePlanId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: carePlan } = await supabase
      .from('patient_care_plans')
      .select('*, care_plan_tasks(*), appointments(*)')
      .eq('id', carePlanId)
      .single();

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
            content: 'Coordinate care activities, identify gaps, schedule follow-ups. Return JSON: { "nextActions": [], "gaps": [], "followUpSchedule": [], "priorityTasks": [], "coordinationPlan": {} }'
          },
          {
            role: 'user',
            content: JSON.stringify({ carePlan })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const coordination = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, coordination }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Care coordination error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
