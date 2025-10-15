// UNLIMITED EDGE FUNCTION CAPACITIES: Clinical Decision Support
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
    const { patientId, clinicalData, context } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: patient } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single();

    const { data: medicalHistory } = await supabase
      .from('appointments')
      .select('*, prescriptions(*)')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false })
      .limit(10);

    console.log('Clinical decision support:', { patientId, context });

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
            content: 'Provide clinical decision support based on evidence-based guidelines. Analyze patient data, suggest diagnostic tests, treatment options, medication interactions, and risk factors. Return JSON: { "primary_recommendations": [], "diagnostic_suggestions": [], "treatment_options": [], "risk_alerts": [], "drug_interactions": [], "evidence_level": "", "confidence": 0-1, "references": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ patientId, patient, clinicalData, medicalHistory, context })
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const decision_support = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, decision_support }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Clinical decision support error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
