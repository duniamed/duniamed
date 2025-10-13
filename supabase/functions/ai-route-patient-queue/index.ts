// UNLIMITED EDGE FUNCTION CAPACITIES: AI-Powered Patient Queue Routing
// Core Principle: Intelligent matching of patients to specialists

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
    const { patientId, clinicId, symptoms, urgencyLevel } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get available live specialists in the clinic
    const { data: liveSpecialists, error: specialistsError } = await supabase
      .from('specialist_live_status')
      .select(`
        specialist_id,
        is_live,
        current_queue_size,
        fatigue_score,
        specialists (
          user_id,
          specialty,
          languages,
          average_rating
        )
      `)
      .eq('clinic_id', clinicId)
      .eq('is_live', true)
      .order('current_queue_size', { ascending: true });

    if (specialistsError) throw specialistsError;

    if (!liveSpecialists || liveSpecialists.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No specialists currently available', availableSpecialists: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AI-powered matching algorithm
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const matchingPrompt = `You are an intelligent healthcare routing system. Match the patient to the best available specialist.

PATIENT SYMPTOMS: ${JSON.stringify(symptoms)}
URGENCY: ${urgencyLevel}

AVAILABLE SPECIALISTS:
${liveSpecialists.map((s: any, i: number) => `
  ${i + 1}. Specialty: ${s.specialists.specialty}, Queue: ${s.current_queue_size}, Fatigue: ${s.fatigue_score}, Rating: ${s.specialists.average_rating}
`).join('')}

Return JSON:
{
  "recommendedSpecialistIndex": 0,
  "reasoning": "Why this specialist is best",
  "estimatedWaitMinutes": 5,
  "priorityScore": 85
}

Consider: symptom-specialty match, queue length, fatigue, urgency level.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [{ role: 'user', content: matchingPrompt }],
        temperature: 0.3,
        max_completion_tokens: 500
      }),
    });

    const aiResponse = await response.json();
    const recommendation = JSON.parse(
      aiResponse.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    );

    const selectedSpecialist = liveSpecialists[recommendation.recommendedSpecialistIndex];

    // Add patient to queue
    const { data: queueEntry, error: queueError } = await supabase
      .from('patient_queue')
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        specialist_id: selectedSpecialist.specialist_id,
        urgency_level: urgencyLevel,
        chief_complaint: symptoms?.chiefComplaint || '',
        symptoms: symptoms,
        priority_score: recommendation.priorityScore,
        estimated_wait_time: recommendation.estimatedWaitMinutes,
        ai_triage_data: recommendation,
        status: 'waiting'
      })
      .select()
      .single();

    if (queueError) throw queueError;

    // Update specialist queue size
    await supabase
      .from('specialist_live_status')
      .update({
        current_queue_size: (selectedSpecialist.current_queue_size || 0) + 1
      })
      .eq('specialist_id', selectedSpecialist.specialist_id);

    console.log('Patient routed to specialist:', selectedSpecialist.specialist_id);

    return new Response(
      JSON.stringify({
        success: true,
        queueEntry,
        assignedSpecialist: selectedSpecialist,
        aiRecommendation: recommendation
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-route-patient-queue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});