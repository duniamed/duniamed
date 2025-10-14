// UNLIMITED EDGE FUNCTION CAPACITIES: Medication Adherence Tracking
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
    const { patientId, prescriptionId, adherenceData } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Tracking medication adherence for patient ${patientId}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Analyze medication adherence patterns. Return JSON: { "adherence_score": 0-100, "missed_doses": number, "pattern_analysis": "", "intervention_needed": boolean, "recommendations": [] }' },
          { role: 'user', content: JSON.stringify(adherenceData) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const adherenceAnalysis = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('medication_adherence_logs').insert({
      patient_id: patientId,
      prescription_id: prescriptionId,
      adherence_data: adherenceData,
      adherence_analysis: adherenceAnalysis,
      adherence_score: adherenceAnalysis.adherence_score,
      logged_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, adherenceAnalysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Adherence tracking error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
