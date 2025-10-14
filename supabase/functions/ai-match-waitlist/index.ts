// UNLIMITED EDGE FUNCTION CAPACITIES: AI Waitlist Matching
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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const { data: waitlistEntries } = await supabase
      .from('appointment_waitlist')
      .select('*, profiles!patient_id(*)')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true });

    const { data: specialists } = await supabase
      .from('specialists')
      .select('id, specialty, user_id')
      .eq('is_accepting_patients', true);

    const matches = [];

    for (const entry of waitlistEntries || []) {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'Match waitlist patients to available appointment slots based on preferences, wait time, urgency, and specialist availability. Return JSON: { "matched": boolean, "slot": "ISO timestamp", "reasoning": "explanation" }'
            },
            {
              role: 'user',
              content: JSON.stringify({
                patient: entry,
                availableSpecialists: specialists,
                preferredDate: entry.preferred_date,
                preferredTimeSlot: entry.preferred_time_slot
              })
            }
          ]
        })
      });

      const aiData = await aiResponse.json();
      const match = JSON.parse(aiData.choices[0].message.content);

      if (match.matched) {
        matches.push({ waitlistId: entry.id, match });
        await supabase
          .from('appointment_waitlist')
          .update({ status: 'matched', notified_at: new Date().toISOString() })
          .eq('id', entry.id);
      }
    }

    return new Response(JSON.stringify({ success: true, matchesFound: matches.length, matches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Waitlist matching error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
