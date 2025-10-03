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
      specialty, 
      modality, 
      date_from, 
      date_to, 
      min_pay_rate,
      max_distance_km,
      location 
    } = await req.json();

    // Get specialist profile
    const { data: specialist } = await supabase
      .from('specialists')
      .select('id, specialty, languages, average_rating')
      .eq('user_id', user.id)
      .single();

    if (!specialist) throw new Error('Specialist profile not found');

    // Build query
    let query = supabase
      .from('shift_listings')
      .select(`
        *,
        clinic:clinics(id, name, logo_url, city, state, country),
        location:clinic_locations(id, location_name, address_line1, city)
      `)
      .eq('status', 'open');

    if (specialty) {
      query = query.contains('specialty_required', [specialty]);
    }

    if (modality) {
      query = query.eq('modality', modality);
    }

    if (date_from) {
      query = query.gte('shift_date', date_from);
    }

    if (date_to) {
      query = query.lte('shift_date', date_to);
    }

    if (min_pay_rate) {
      query = query.gte('pay_rate', min_pay_rate);
    }

    const { data: shifts, error } = await query.order('shift_date', { ascending: true });

    if (error) throw error;

    // Calculate match scores
    const shiftsWithScores = shifts?.map(shift => {
      let matchScore = 0;

      // Specialty match (40 points)
      if (shift.specialty_required.some((s: string) => specialist.specialty.includes(s))) {
        matchScore += 40;
      }

      // Rating requirement (20 points)
      if (!shift.minimum_rating || specialist.average_rating >= shift.minimum_rating) {
        matchScore += 20;
      }

      // Language match (20 points)
      if (shift.language_required.some((lang: string) => specialist.languages.includes(lang))) {
        matchScore += 20;
      }

      // Urgency bonus (20 points)
      if (shift.urgency_level === 'emergency' || shift.urgency_level === 'urgent') {
        matchScore += 20;
      }

      return {
        ...shift,
        match_score: matchScore,
        eligible: matchScore >= 60
      };
    }) || [];

    // Sort by match score
    shiftsWithScores.sort((a, b) => b.match_score - a.match_score);

    return new Response(
      JSON.stringify({ shifts: shiftsWithScores }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Find shifts error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});