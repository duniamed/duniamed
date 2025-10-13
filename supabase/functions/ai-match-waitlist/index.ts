// UNLIMITED EDGE FUNCTION CAPACITIES: AI-Powered Waitlist Matching
// Core Principle: Intelligent slot allocation with patient preferences

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
    const { waitlistId, newlyAvailableSlot } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get waitlist entry
    const { data: waitlistEntry, error: waitlistError } = await supabase
      .from('intelligent_waitlist')
      .select('*')
      .eq('id', waitlistId)
      .single();

    if (waitlistError) throw waitlistError;

    // Find matching slots
    const { data: availableSlots, error: slotsError } = await supabase
      .from('specialist_availability_cache')
      .select(`
        *,
        specialists (
          user_id,
          specialty,
          average_rating,
          languages
        )
      `)
      .in('specialist_id', waitlistEntry.preferred_specialists || [])
      .gte('date', new Date().toISOString().split('T')[0])
      .gt('total_slots', 0);

    if (slotsError) throw slotsError;

    // AI-powered slot ranking
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const matchingPrompt = `You are an intelligent appointment scheduling system. Rank the best appointment slots for this patient.

PATIENT PREFERENCES:
- Specialty: ${waitlistEntry.specialty_requested}
- Preferred times: ${JSON.stringify(waitlistEntry.preferred_times)}
- Urgency: ${waitlistEntry.urgency_score}
- Max wait: ${waitlistEntry.max_wait_days} days

AVAILABLE SLOTS:
${availableSlots?.slice(0, 20).map((slot: any, i: number) => `
  ${i + 1}. Date: ${slot.date}, Specialist: ${slot.specialists.specialty}, Rating: ${slot.specialists.average_rating}, Available slots: ${slot.total_slots - slot.booked_slots}
`).join('')}

Return JSON array of top 5 matches:
[
  {
    "slotId": "uuid",
    "score": 95,
    "reasoning": "Perfect time match, high-rated specialist, immediate availability"
  }
]

Prioritize: urgency, preferred times, specialist rating, earliest availability.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [{ role: 'user', content: matchingPrompt }],
        temperature: 0.4,
        max_completion_tokens: 1000
      }),
    });

    const aiResponse = await response.json();
    const matches = JSON.parse(
      aiResponse.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    );

    // Update waitlist with matches
    await supabase
      .from('intelligent_waitlist')
      .update({
        best_matches: matches,
        status: matches.length > 0 ? 'matched' : 'active',
        matched_at: matches.length > 0 ? new Date().toISOString() : null
      })
      .eq('id', waitlistId);

    // Send notification to patient
    if (matches.length > 0 && waitlistEntry.notification_preferences?.email) {
      await supabase.functions.invoke('send-multi-channel-notification', {
        body: {
          user_id: waitlistEntry.patient_id,
          subject: 'Appointment Slots Available!',
          message: `We found ${matches.length} appointment slots that match your preferences. Book now!`,
          notification_type: 'waitlist_match',
          metadata: {
            waitlist_id: waitlistId,
            top_match: matches[0]
          }
        }
      });

      await supabase
        .from('intelligent_waitlist')
        .update({ last_notification_sent: new Date().toISOString() })
        .eq('id', waitlistId);
    }

    console.log(`Matched ${matches.length} slots for waitlist ${waitlistId}`);

    return new Response(
      JSON.stringify({
        success: true,
        matches,
        notificationSent: matches.length > 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-match-waitlist:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});