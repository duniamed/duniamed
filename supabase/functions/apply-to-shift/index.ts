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

    const { shift_listing_id, cover_message } = await req.json();

    // Get specialist profile with credentials
    const { data: specialist } = await supabase
      .from('specialists')
      .select('id, user_id, specialty, average_rating, verification_status')
      .eq('user_id', user.id)
      .single();

    if (!specialist) throw new Error('Specialist profile not found');
    if (specialist.verification_status !== 'verified') {
      throw new Error('Credentials must be verified before applying to shifts');
    }

    // Get shift details
    const { data: shift } = await supabase
      .from('shift_listings')
      .select('*, clinic:clinics(name)')
      .eq('id', shift_listing_id)
      .single();

    if (!shift) throw new Error('Shift not found');
    if (shift.status !== 'open') throw new Error('Shift is no longer available');

    // Check if already applied
    const { data: existing } = await supabase
      .from('shift_applications')
      .select('id')
      .eq('shift_listing_id', shift_listing_id)
      .eq('specialist_id', specialist.id)
      .single();

    if (existing) throw new Error('Already applied to this shift');

    // Verify credentials match requirements
    const { data: credentials } = await supabase
      .from('credential_verifications')
      .select('*')
      .eq('specialist_id', specialist.id)
      .eq('verification_status', 'verified')
      .gte('expiration_date', new Date().toISOString());

    const hasRequiredLicenses = shift.required_licenses.length === 0 || 
      shift.required_licenses.some((lic: string) => 
        credentials?.some(c => c.credential_number === lic)
      );

    if (!hasRequiredLicenses) {
      throw new Error('Missing required licenses for this shift');
    }

    // Calculate match score
    let matchScore = 0;
    const matchFactors: any = {};

    // Specialty match (40%)
    if (shift.specialty_required.some((s: string) => specialist.specialty.includes(s))) {
      matchScore += 40;
      matchFactors.specialty_match = true;
    }

    // Rating match (30%)
    if (!shift.minimum_rating || specialist.average_rating >= shift.minimum_rating) {
      matchScore += 30;
      matchFactors.rating_match = true;
    }

    // Urgency bonus (30%)
    if (shift.urgency_level === 'emergency') {
      matchScore += 30;
      matchFactors.urgency_bonus = true;
    }

    // Auto-approve for high scores and high-rated specialists
    const autoApprove = shift.auto_accept_high_rated && 
                       matchScore >= 80 && 
                       specialist.average_rating >= 4.5;

    // Create application
    const { data: application, error } = await supabase
      .from('shift_applications')
      .insert({
        shift_listing_id,
        specialist_id: specialist.id,
        user_id: user.id,
        cover_message,
        match_score: matchScore,
        match_factors: matchFactors,
        application_status: autoApprove ? 'auto_approved' : 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // If auto-approved, create assignment
    if (autoApprove) {
      const { data: assignment } = await supabase
        .from('shift_assignments')
        .insert({
          shift_listing_id,
          specialist_id: specialist.id,
          clinic_id: shift.clinic_id,
          application_id: application.id,
          confirmed_by: user.id,
          amount_due: shift.pay_rate,
          currency: shift.pay_currency,
          rating_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      // Update shift status
      await supabase
        .from('shift_listings')
        .update({ 
          status: 'filled', 
          filled_at: new Date().toISOString(),
          assigned_specialist_id: specialist.id
        })
        .eq('id', shift_listing_id);

      // Send notification
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: user.id,
          title: 'Shift Confirmed! 🎉',
          message: `You've been auto-approved for ${shift.clinic.name} on ${shift.shift_date}`,
          type: 'shift_confirmed',
          data: { assignment_id: assignment.id }
        }
      });
    }

    // Increment applications count
    await supabase
      .from('shift_listings')
      .update({ applications_count: shift.applications_count + 1 })
      .eq('id', shift_listing_id);

    return new Response(
      JSON.stringify({ 
        application,
        auto_approved: autoApprove,
        message: autoApprove ? 'Shift confirmed instantly!' : 'Application submitted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Apply to shift error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});