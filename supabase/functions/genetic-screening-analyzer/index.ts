// UNLIMITED EDGE FUNCTION CAPACITIES: Genetic Screening Analyzer
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
    const { patient_id, genetic_data, analysis_type } = await req.json();

    console.log(`Analyzing genetic screening for patient: ${patient_id}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch patient medical history
    const { data: history } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patient_id);

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
            content: `Analyze genetic screening data and provide risk assessment. Return JSON with:
- risk_factors: Array of identified genetic risk factors
- disease_predisposition: Conditions with increased risk
- carrier_status: Genetic carrier information
- recommendations: Preventive care recommendations
- lifestyle_modifications: Suggested lifestyle changes
- screening_schedule: Recommended health screenings
- family_planning: Considerations for family planning
- confidence_score: 0-1 confidence in analysis`
          },
          {
            role: 'user',
            content: JSON.stringify({ genetic_data, analysis_type, medical_history: history })
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // Store analysis
    await supabase.from('genetic_screenings').insert({
      patient_id,
      analysis_type,
      analysis_result: analysis,
      analyzed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Genetic screening error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});