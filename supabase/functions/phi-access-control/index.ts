// UNLIMITED EDGE FUNCTION CAPACITIES: PHI Access Control Validation
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
    const { userId, patientId, requestedAction } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Validating PHI access: User ${userId} requesting ${requestedAction} for patient ${patientId}`);

    const { data: user } = await supabase.from('profiles').select('role').eq('id', userId).single();
    const { data: relationship } = await supabase
      .from('care_team_members')
      .select('*')
      .eq('specialist_id', userId)
      .eq('patient_id', patientId)
      .single();

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Validate PHI access based on HIPAA. Return JSON: { "authorized": boolean, "reason": "", "minimum_necessary": boolean, "requires_consent": boolean }' },
          { role: 'user', content: JSON.stringify({ user, relationship, requestedAction }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const validation = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('phi_access_log').insert({
      user_id: userId,
      patient_id: patientId,
      action: requestedAction,
      authorized: validation.authorized,
      reason: validation.reason,
      accessed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, validation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('PHI access control error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
