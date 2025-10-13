// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { team_id, patient_id } = await req.json();

    // Get team data
    const { data: team } = await supabaseClient
      .from('care_teams')
      .select('*, care_team_members(*)')
      .eq('id', team_id)
      .single();

    // Get patient appointments
    const { data: appointments } = await supabaseClient
      .from('appointments')
      .select('*')
      .eq('patient_id', patient_id)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    // Generate AI insight
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'system',
          content: 'Analyze care team performance and patient progress. Provide brief summary with percentage improvement, key findings, and recommendations.'
        }, {
          role: 'user',
          content: `Team: ${team.name}, Members: ${team.care_team_members.length}, Recent appointments: ${appointments?.length || 0}`
        }],
      }),
    });

    const aiData = await aiResponse.json();
    const insight = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ success: true, insight, data: { team, appointments } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});