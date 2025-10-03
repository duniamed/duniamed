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
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    const { 
      rating_type,
      appointment_id,
      shift_assignment_id,
      ratee_id,
      ratee_type,
      overall_rating,
      dimensions,
      review_text,
      tags
    } = await req.json();

    // Verify the interaction exists and user is authorized
    if (rating_type === 'appointment' && appointment_id) {
      const { data: appointment } = await supabase
        .from('appointments')
        .select('patient_id, specialist_id, status')
        .eq('id', appointment_id)
        .single();

      if (!appointment) throw new Error('Appointment not found');
      if (appointment.status !== 'completed') throw new Error('Can only rate completed appointments');

      // Verify user is participant
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const isParticipant = appointment.patient_id === user.id || 
                           specialist?.id === appointment.specialist_id;

      if (!isParticipant) throw new Error('Not authorized to rate this appointment');
    }

    if (rating_type === 'shift' && shift_assignment_id) {
      const { data: shift } = await supabase
        .from('shift_assignments')
        .select('specialist_id, clinic_id, status')
        .eq('id', shift_assignment_id)
        .single();

      if (!shift) throw new Error('Shift not found');
      if (shift.status !== 'completed') throw new Error('Can only rate completed shifts');
    }

    // Get user profile to determine rater type
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('User profile not found');

    let rater_type = 'patient';
    if (profile.role === 'specialist') rater_type = 'specialist';
    if (profile.role === 'clinic_admin') rater_type = 'clinic_admin';

    // Check for duplicate rating
    const { data: existing } = await supabase
      .from('bilateral_ratings')
      .select('id')
      .eq('rater_id', user.id)
      .eq('ratee_id', ratee_id)
      .eq(appointment_id ? 'appointment_id' : 'shift_assignment_id', 
          appointment_id || shift_assignment_id)
      .single();

    if (existing) throw new Error('You have already rated this interaction');

    // AI moderation check
    let moderation_status = 'active';
    if (review_text) {
      const moderationResult = await supabase.functions.invoke('ai-moderate-content', {
        body: { content: review_text, contentType: 'review' }
      });

      if (moderationResult.data?.flagged) {
        moderation_status = 'under_review';
      }
    }

    // Create rating
    const ratingData: any = {
      rating_type,
      appointment_id,
      shift_assignment_id,
      rater_id: user.id,
      rater_type,
      ratee_id,
      ratee_type,
      overall_rating,
      review_text,
      tags,
      moderation_status,
      verified_interaction: true,
      interaction_completed: true,
      is_public: ratee_type === 'specialist' // Public for specialist ratings, private for patient ratings
    };

    // Add dimension-specific ratings
    if (dimensions) {
      Object.assign(ratingData, dimensions);
    }

    const { data: rating, error } = await supabase
      .from('bilateral_ratings')
      .insert(ratingData)
      .select()
      .single();

    if (error) throw error;

    // Update aggregate ratings
    if (ratee_type === 'specialist') {
      const { data: allRatings } = await supabase
        .from('bilateral_ratings')
        .select('overall_rating')
        .eq('ratee_id', ratee_id)
        .eq('ratee_type', 'specialist')
        .eq('moderation_status', 'active');

      if (allRatings && allRatings.length > 0) {
        const avgRating = allRatings.reduce((sum, r) => sum + r.overall_rating, 0) / allRatings.length;
        
        const { data: specialist } = await supabase
          .from('specialists')
          .select('user_id')
          .eq('user_id', ratee_id)
          .single();

        if (specialist) {
          await supabase
            .from('specialists')
            .update({ 
              average_rating: avgRating,
              total_reviews: allRatings.length
            })
            .eq('user_id', ratee_id);
        }
      }
    }

    // Update assignment with rating completion
    if (shift_assignment_id) {
      const updateField = rater_type === 'specialist' ? 'specialist_rated_clinic' : 'clinic_rated_specialist';
      await supabase
        .from('shift_assignments')
        .update({ [updateField]: true })
        .eq('id', shift_assignment_id);
    }

    // Send notification to ratee
    await supabase.functions.invoke('send-notification', {
      body: {
        user_id: ratee_id,
        title: 'New Rating Received',
        message: `You received a ${overall_rating}-star rating`,
        type: 'rating_received',
        data: { rating_id: rating.id }
      }
    });

    return new Response(
      JSON.stringify({ rating, message: 'Rating submitted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Submit rating error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});