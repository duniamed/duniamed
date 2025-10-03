import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * C10 PROCEDURES - Match Notification System
 * 
 * PURPOSE:
 * - Notify patients when matched with specialists for procedures
 * - Calculate match scores based on expertise and availability
 * - Send multi-channel notifications (email, SMS, push)
 * 
 * WORKFLOW:
 * 1. Receive procedure search/question from patient
 * 2. Find matching specialists with expertise
 * 3. Calculate match score based on:
 *    - Specialist expertise level
 *    - Patient reviews and ratings
 *    - Availability
 *    - Geographic proximity
 * 4. Create match records
 * 5. Send notifications to patient
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientId, procedureId } = await req.json();

    if (!patientId || !procedureId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get procedure details
    const { data: procedure, error: procError } = await supabase
      .from('procedure_catalog')
      .select('*, specialist_procedures(specialist_id, proficiency_level)')
      .eq('id', procedureId)
      .single();

    if (procError || !procedure) {
      throw new Error('Procedure not found');
    }

    // Find matching specialists
    const { data: specialists, error: specError } = await supabase
      .from('specialist_procedures')
      .select(`
        specialist_id,
        proficiency_level,
        specialists!inner(
          id,
          user_id,
          is_accepting_patients,
          profiles!specialists_user_id_fkey(first_name, last_name, email)
        )
      `)
      .eq('procedure_id', procedureId)
      .eq('specialists.is_accepting_patients', true);

    if (specError) throw specError;

    if (!specialists || specialists.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No matching specialists found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate match scores and create records
    const matches = [];
    for (const spec of specialists) {
      // Simple scoring algorithm (can be enhanced)
      let score = 0.5; // Base score

      // Proficiency level bonus
      if (spec.proficiency_level === 'expert') score += 0.3;
      else if (spec.proficiency_level === 'intermediate') score += 0.15;

      // Get specialist reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('specialist_id', spec.specialist_id);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        score += (avgRating / 5) * 0.2; // Max 0.2 bonus from ratings
      }

      // Ensure score doesn't exceed 1.0
      score = Math.min(score, 1.0);

      // Create match record
      const { data: match, error: matchError } = await supabase
        .from('procedure_matches')
        .insert({
          patient_id: patientId,
          procedure_id: procedureId,
          specialist_id: spec.specialist_id,
          match_score: score,
          match_reason: {
            proficiency: spec.proficiency_level,
            accepting_patients: true,
          },
        })
        .select()
        .single();

      if (!matchError && match) {
        matches.push(match);

        // Send notification to patient
        await supabase.functions.invoke('send-notification', {
          body: {
            userId: patientId,
            type: 'procedure_match',
            title: 'New Specialist Match',
            message: `Found a ${spec.proficiency_level} specialist for ${procedure.procedure_name}`,
            data: {
              matchId: match.id,
              procedureId,
              specialistId: spec.specialist_id,
              matchScore: score,
            },
          },
        });
      }
    }

    // Mark notifications as sent
    await supabase
      .from('procedure_matches')
      .update({ notification_sent: true, notification_sent_at: new Date().toISOString() })
      .in('id', matches.map(m => m.id));

    console.log(`Created ${matches.length} matches for patient ${patientId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        matchCount: matches.length,
        matches: matches.map(m => ({
          id: m.id,
          specialistId: m.specialist_id,
          score: m.match_score,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Match notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create matches' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
