import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoutingWeights {
  availability: number;
  timezone: number;
  language: number;
  specialty: number;
  rating: number;
  experience: number;
  price: number;
}

interface SpecialistScore {
  id: string;
  score: number;
  specialist: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { 
      patientTimezone = 'UTC', 
      patientLanguage = 'en',
      specialty,
      urgencyLevel = 'routine',
      maxPrice
    } = await req.json();

    console.log('Instant connect request:', { patientTimezone, patientLanguage, specialty, urgencyLevel });

    // Fetch online specialists
    let query = supabase
      .from('specialists')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url,
          country,
          city,
          timezone
        )
      `)
      .eq('is_online', true)
      .eq('is_accepting_patients', true)
      .eq('verification_status', 'verified')
      .eq('video_consultation_enabled', true);

    if (specialty) {
      query = query.contains('specialty', [specialty]);
    }

    if (maxPrice) {
      query = query.lte('consultation_fee_min', maxPrice);
    }

    const { data: specialists, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!specialists || specialists.length === 0) {
      return new Response(
        JSON.stringify({ 
          specialist: null, 
          message: 'No specialists available right now. Please try again in a few minutes.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define routing weights based on urgency
    const weights: RoutingWeights = urgencyLevel === 'emergency' ? {
      availability: 0.5,  // Prioritize who's most available
      timezone: 0.1,      // Less important in emergencies
      language: 0.15,     // Important for communication
      specialty: 0.15,    // Important but not critical
      rating: 0.05,       // Less important in emergencies
      experience: 0.03,   // Less important in emergencies
      price: 0.02         // Least important in emergencies
    } : {
      availability: 0.25,
      timezone: 0.20,     // More important for routine
      language: 0.15,
      specialty: 0.15,
      rating: 0.15,       // Quality matters for routine
      experience: 0.07,
      price: 0.03
    };

    // Calculate scores for each specialist
    const scoredSpecialists: SpecialistScore[] = specialists.map((specialist) => {
      let score = 0;

      // 1. Availability (always online = max score)
      score += weights.availability * 1.0;

      // 2. Timezone proximity
      const specialistTz = specialist.profiles?.timezone || specialist.timezone || 'UTC';
      const tzProximity = calculateTimezoneProximity(patientTimezone, specialistTz);
      score += weights.timezone * tzProximity;

      // 3. Language match
      const languages = specialist.languages || ['en'];
      const languageMatch = languages.includes(patientLanguage) ? 1.0 : 0.3;
      score += weights.language * languageMatch;

      // 4. Specialty relevance (already filtered, so give full points if present)
      score += weights.specialty * 1.0;

      // 5. Rating (normalize to 0-1)
      const rating = (specialist.average_rating || 0) / 5.0;
      score += weights.rating * rating;

      // 6. Experience (normalize, cap at 30 years)
      const experience = Math.min((specialist.years_experience || 0) / 30, 1.0);
      score += weights.experience * experience;

      // 7. Price (inverse: lower price = higher score)
      const price = specialist.consultation_fee_min || 100;
      const priceScore = 1 - Math.min(price / 500, 1.0); // Assume max $500
      score += weights.price * priceScore;

      return { id: specialist.id, score, specialist };
    });

    // Sort by score (highest first)
    scoredSpecialists.sort((a, b) => b.score - a.score);

    // Return top specialist
    const bestMatch = scoredSpecialists[0];
    
    console.log('Best match:', {
      specialist: `${bestMatch.specialist.profiles?.first_name} ${bestMatch.specialist.profiles?.last_name}`,
      score: bestMatch.score,
      specialty: bestMatch.specialist.specialty
    });

    return new Response(
      JSON.stringify({
        specialist: bestMatch.specialist,
        score: bestMatch.score,
        estimatedWaitMinutes: 0, // Instant connection
        message: 'Specialist found and ready to connect!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in instant-connect:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Calculate timezone proximity (0-1, where 1 = same timezone)
 */
function calculateTimezoneProximity(tz1: string, tz2: string): number {
  const offset1 = parseTimezoneOffset(tz1);
  const offset2 = parseTimezoneOffset(tz2);
  
  const hoursDiff = Math.abs(offset1 - offset2);
  
  // Maximum reasonable difference is 24 hours
  return Math.max(0, 1 - (hoursDiff / 24));
}

/**
 * Parse timezone string to hour offset from UTC
 */
function parseTimezoneOffset(tz: string): number {
  // Handle formats like "UTC-8", "UTC+5", "EST", etc.
  if (tz.startsWith('UTC')) {
    const match = tz.match(/UTC([+-]\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
  
  // Common timezone abbreviations
  const tzMap: Record<string, number> = {
    'PST': -8, 'PDT': -7,
    'MST': -7, 'MDT': -6,
    'CST': -6, 'CDT': -5,
    'EST': -5, 'EDT': -4,
    'GMT': 0, 'UTC': 0,
    'CET': 1, 'CEST': 2,
    'SGT': 8,
    'AEST': 10, 'AEDT': 11
  };
  
  return tzMap[tz] || 0;
}