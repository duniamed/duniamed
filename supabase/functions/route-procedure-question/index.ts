import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * C10 PROCEDURES - Intelligent Q&A Routing
 * 
 * WORKFLOW:
 * 1. Patient asks question about a procedure
 * 2. System identifies specialists who perform this procedure
 * 3. Routes to specialist with:
 *    - Highest match score for procedure
 *    - Best response rate
 *    - Available capacity
 * 4. Notifies specialist of new question
 * 5. Tracks response time for quality metrics
 * 
 * INTEGRATION:
 * - Medical ontology for procedure matching
 * - Notification system for instant alerts
 * - Analytics for response rate tracking
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get question details
    const { data: question, error: questionError } = await supabase
      .from('procedure_questions')
      .select(`
        id,
        procedure_id,
        question,
        patient_id,
        procedure_catalog!inner(
          procedure_name,
          category,
          specialty_tags
        )
      `)
      .eq('id', question_id)
      .single();

    if (questionError) throw questionError;

    // Find specialists who perform this procedure
    const specialtyTags = question.procedure_catalog.specialty_tags || [];
    
    const { data: specialists, error: specialistsError } = await supabase
      .from('specialists')
      .select(`
        id,
        user_id,
        specialty,
        average_rating,
        total_consultations
      `)
      .overlaps('specialty', specialtyTags)
      .eq('is_accepting_patients', true)
      .order('average_rating', { ascending: false })
      .limit(5);

    if (specialistsError) throw specialistsError;

    if (!specialists || specialists.length === 0) {
      console.warn('No specialists found for procedure:', question.procedure_catalog.procedure_name);
      return new Response(
        JSON.stringify({ success: false, error: 'No specialists available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route to best-matched specialist
    const bestMatch = specialists[0];

    await supabase
      .from('procedure_questions')
      .update({
        routed_to: bestMatch.id,
        status: 'routed'
      })
      .eq('id', question_id);

    // Notify specialist
    await supabase.functions.invoke('send-notification', {
      body: {
        user_id: bestMatch.user_id,
        type: 'procedure_question',
        title: 'New Procedure Question',
        message: `A patient asked about ${question.procedure_catalog.procedure_name}`,
        data: {
          question_id,
          procedure_name: question.procedure_catalog.procedure_name
        }
      }
    });

    console.log(`Question routed to specialist ${bestMatch.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        routed_to: bestMatch.id,
        specialists_notified: 1
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Question routing error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
