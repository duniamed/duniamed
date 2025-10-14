// UNLIMITED EDGE FUNCTION CAPACITIES: Clinical Trial Matching
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
    const { patientId, conditions, demographics } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Matching clinical trials for patient ${patientId}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Match patient to clinical trials. Return JSON: { "matches": [{"trial_id": "", "match_score": 0-100, "reasons": [], "eligibility": "eligible|maybe|ineligible"}] }' },
          { role: 'user', content: JSON.stringify({ conditions, demographics }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const matches = JSON.parse(aiData.choices[0].message.content);

    for (const match of matches.matches.filter((m: any) => m.match_score > 70)) {
      await supabase.from('clinical_trial_matches').insert({
        patient_id: patientId,
        trial_id: match.trial_id,
        match_score: match.match_score,
        eligibility: match.eligibility,
        matched_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({ success: true, matches: matches.matches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Clinical trial matching error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
