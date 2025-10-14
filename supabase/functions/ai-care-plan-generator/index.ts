// UNLIMITED EDGE FUNCTION CAPACITIES: AI Care Plan Generator
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

    const { patient_id, diagnosis, symptoms, medical_history } = await req.json();

    console.log(`Generating care plan for patient: ${patient_id}`);

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
            content: `Generate a comprehensive care plan based on patient data. Return JSON with:
- goals: Array of treatment goals
- interventions: Array of recommended interventions
- medications: Array of medication recommendations
- monitoring: Monitoring schedule and metrics
- education: Patient education materials
- follow_up: Follow-up schedule`
          },
          {
            role: 'user',
            content: `Patient diagnosis: ${diagnosis}\nSymptoms: ${JSON.stringify(symptoms)}\nMedical history: ${JSON.stringify(medical_history)}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const carePlan = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, care_plan: carePlan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Care plan generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
