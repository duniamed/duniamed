// UNLIMITED EDGE FUNCTION CAPACITIES: Real-time ICD-10 Code Suggestions
// Core Principle: No memorization - AI auto-suggests codes

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
    const { symptoms, patientHistory, specialistId, patientId } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check cache first
    const { data: cached } = await supabase
      .from('ai_clinical_suggestions_cache')
      .select('*')
      .eq('specialist_id', specialistId)
      .eq('patient_id', patientId)
      .eq('suggestion_type', 'icd10')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached && JSON.stringify(cached.input_context) === JSON.stringify({ symptoms, patientHistory })) {
      console.log('Returning cached ICD-10 suggestions');
      return new Response(
        JSON.stringify(cached.suggestions),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new suggestions
    const prompt = `You are an expert medical coding assistant. Based on the following clinical information, suggest the top 5 most appropriate ICD-10 codes.

SYMPTOMS: ${JSON.stringify(symptoms)}
PATIENT HISTORY: ${JSON.stringify(patientHistory)}

Return ONLY valid JSON array with this structure:
[
  {
    "code": "ICD-10 code",
    "description": "Full description",
    "confidence": 0.95,
    "reasoning": "Why this code is appropriate"
  }
]

Use current ICD-10-CM codes. Be specific and accurate.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'You are a medical coding expert specializing in ICD-10-CM codes. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_completion_tokens: 2000
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const suggestionsText = aiResponse.choices[0].message.content;
    
    // Parse JSON response
    const suggestions = JSON.parse(suggestionsText.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

    // Cache suggestions
    await supabase.from('ai_clinical_suggestions_cache').insert({
      specialist_id: specialistId,
      patient_id: patientId,
      suggestion_type: 'icd10',
      input_context: { symptoms, patientHistory },
      suggestions: suggestions,
      confidence_scores: suggestions.map((s: any) => s.confidence)
    });

    console.log('ICD-10 suggestions generated:', suggestions.length);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-suggest-icd10-realtime:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});