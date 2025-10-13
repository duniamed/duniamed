import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { symptoms, location, insurancePlan, language, patientId } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    console.log('Matching specialists for symptoms:', symptoms);

    // Use AI to analyze symptoms and suggest specialties
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          {
            role: 'system',
            content: 'You are a medical triage AI. Based on symptoms, suggest the most appropriate medical specialties. Return only specialty names as array.'
          },
          {
            role: 'user',
            content: `Patient symptoms: ${symptoms}. What medical specialties should they see? Return as JSON array of specialty names.`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const suggestedSpecialties = JSON.parse(aiData.choices[0].message.content).specialties || [];

    // Get patient medical history if logged in
    let patientHistory = null;
    if (patientId) {
      const { data: summary } = await supabase
        .from('patient_medical_summary')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      
      patientHistory = summary;
    }

    // Find specialists matching criteria
    let query = supabase
      .from('specialists')
      .select(`
        id,
        user_id,
        specialty,
        sub_specialty,
        languages,
        average_rating,
        total_reviews,
        is_accepting_patients,
        profiles!inner(first_name, last_name, avatar_url),
        availability_schedules!inner(*)
      `)
      .eq('is_accepting_patients', true)
      .eq('verification_status', 'verified');

    // Filter by suggested specialties
    if (suggestedSpecialties.length > 0) {
      query = query.overlaps('specialty', suggestedSpecialties);
    }

    // Filter by language if specified
    if (language) {
      query = query.contains('languages', [language]);
    }

    const { data: specialists, error } = await query;

    if (error) throw error;

    // Calculate match scores and next available slots
    const rankedSpecialists = await Promise.all(specialists.map(async (specialist) => {
      let matchScore = 0;

      // Specialty match (40 points)
      const specialtyMatch = suggestedSpecialties.some(s => specialist.specialty.includes(s));
      if (specialtyMatch) matchScore += 40;

      // Rating (20 points)
      matchScore += (specialist.average_rating || 0) * 4;

      // Language match (10 points)
      if (language && specialist.languages.includes(language)) {
        matchScore += 10;
      }

      // Patient history relevance (10 points)
      if (patientHistory) {
        // Check if specialist has treated similar conditions
        const hasRelevantHistory = patientHistory.chronic_conditions?.some(
          (condition: any) => specialist.specialty.some((s: string) => 
            s.toLowerCase().includes(condition.toLowerCase())
          )
        );
        if (hasRelevantHistory) matchScore += 10;
      }

      // Get next available slot (20 points based on availability)
      const { data: nextSlots } = await supabase.functions.invoke('find-available-slots', {
        body: {
          specialistId: specialist.id,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      });

      const nextAvailable = nextSlots?.slots?.[0];
      const daysUntilAvailable = nextAvailable 
        ? Math.ceil((new Date(nextAvailable).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 999;

      // Faster availability = higher score
      if (daysUntilAvailable <= 1) matchScore += 20;
      else if (daysUntilAvailable <= 3) matchScore += 15;
      else if (daysUntilAvailable <= 7) matchScore += 10;

      return {
        ...specialist,
        matchScore,
        nextAvailableSlot: nextAvailable,
        daysUntilAvailable
      };
    }));

    // Sort by match score
    rankedSpecialists.sort((a, b) => b.matchScore - a.matchScore);

    return new Response(JSON.stringify({
      success: true,
      specialists: rankedSpecialists.slice(0, 10), // Top 10 matches
      suggestedSpecialties
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Smart specialist matcher error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});