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

    const { patientId, symptoms, vitals, context } = await req.json();

    // Fetch patient history
    const { data: history } = await supabase
      .from('appointments')
      .select('*, soap_notes(*)')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false })
      .limit(10);

    const { data: allergies } = await supabase
      .from('patient_allergies')
      .select('*')
      .eq('patient_id', patientId);

    const { data: medications } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active');

    // Real-time clinical decision support
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
            content: `Provide real-time clinical decision support. Return JSON:
{
  "differential_diagnosis": [
    {
      "condition": "string",
      "probability": 0-1,
      "supporting_evidence": ["string"],
      "icd10_codes": ["string"]
    }
  ],
  "recommended_tests": [
    {
      "test": "string",
      "urgency": "routine|urgent|stat",
      "rationale": "string"
    }
  ],
  "treatment_recommendations": [
    {
      "intervention": "string",
      "evidence_level": "A|B|C",
      "contraindications": ["string"]
    }
  ],
  "drug_interactions": [
    {
      "drugs": ["string"],
      "severity": "minor|moderate|severe",
      "recommendation": "string"
    }
  ],
  "alerts": [
    {
      "type": "allergy|interaction|guideline",
      "severity": "low|medium|high",
      "message": "string"
    }
  ],
  "guidelines": ["string"]
}`
          },
          {
            role: 'user',
            content: JSON.stringify({
              symptoms,
              vitals,
              history,
              allergies,
              medications,
              context
            })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const decision_support = JSON.parse(aiData.choices[0].message.content);

    // Log decision support usage
    await supabase.from('clinical_decision_logs').insert({
      patient_id: patientId,
      support_data: decision_support,
      context,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      decision_support
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Clinical decision support error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
