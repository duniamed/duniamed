// UNLIMITED EDGE FUNCTION CAPACITIES: Real-time Prescription Suggestions
// Core Principle: No memorization - AI auto-suggests medications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { diagnosis, patientAge, allergies, currentMedications, specialistId, patientId } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check drug interactions first
    const { data: interactionCheck } = await supabase.functions.invoke('check-drug-interactions', {
      body: { currentMedications, proposedMedications: [] }
    });

    const prompt = `You are an expert clinical pharmacist. Suggest appropriate medications for the following case:

DIAGNOSIS: ${diagnosis}
PATIENT AGE: ${patientAge}
ALLERGIES: ${JSON.stringify(allergies || [])}
CURRENT MEDICATIONS: ${JSON.stringify(currentMedications || [])}

Return ONLY valid JSON array:
[
  {
    "medication": "Generic name (Brand name)",
    "dosage": "Dose and frequency",
    "duration": "Duration of treatment",
    "route": "Route of administration",
    "indication": "Why this medication",
    "warnings": ["Contraindication 1", "Warning 2"],
    "alternatives": ["Alternative medication 1"],
    "confidence": 0.92,
    "drug_interactions": []
  }
]

Consider drug interactions, age-appropriate dosing, and current medications. Prioritize evidence-based, guideline-recommended treatments.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'You are a clinical pharmacist expert. Always return valid JSON with evidence-based medication recommendations.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_completion_tokens: 3000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const suggestionsText = aiResponse.choices[0].message.content;
    const suggestions = JSON.parse(suggestionsText.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

    // Cache suggestions
    await supabase.from('ai_clinical_suggestions_cache').insert({
      specialist_id: specialistId,
      patient_id: patientId,
      suggestion_type: 'prescription',
      input_context: { diagnosis, patientAge, allergies, currentMedications },
      suggestions: suggestions,
      confidence_scores: suggestions.map((s: any) => s.confidence)
    });

    console.log('Prescription suggestions generated:', suggestions.length);

    return new Response(
      JSON.stringify({ suggestions, interactions: interactionCheck }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-suggest-prescription-realtime:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});