// UNLIMITED EDGE FUNCTION CAPACITIES: Lab Results Integration
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
    const { patientId, labProvider, testType } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Fetching lab results from ${labProvider} for patient ${patientId}`);

    // Simulated lab results
    const labResults = {
      test_id: crypto.randomUUID(),
      test_type: testType,
      results: {
        hemoglobin: { value: 14.2, unit: 'g/dL', normal_range: '13.5-17.5', status: 'normal' },
        white_blood_cells: { value: 7.5, unit: '10^9/L', normal_range: '4.5-11.0', status: 'normal' },
        platelets: { value: 250, unit: '10^9/L', normal_range: '150-400', status: 'normal' },
        glucose: { value: 95, unit: 'mg/dL', normal_range: '70-100', status: 'normal' }
      },
      performed_at: new Date().toISOString(),
      lab_name: labProvider
    };

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Analyze lab results. Return JSON: { "summary": "", "abnormalities": [], "recommendations": [], "followup_needed": boolean, "urgency": "low|medium|high" }' },
          { role: 'user', content: JSON.stringify(labResults) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('lab_results').insert({
      patient_id: patientId,
      test_data: labResults,
      ai_analysis: analysis,
      status: 'completed'
    });

    return new Response(JSON.stringify({ success: true, labResults, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Lab results error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
