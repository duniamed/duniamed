// UNLIMITED EDGE FUNCTION CAPACITIES: No-Show Prediction
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
    const { appointment_id, patient_id } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: history } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patient_id)
      .order('scheduled_at', { ascending: false })
      .limit(20);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Predict no-show probability based on patient history. Return JSON with:
- no_show_probability: 0-1 probability score
- risk_level: low/medium/high
- risk_factors: Array of contributing factors
- recommendations: Actions to reduce no-show risk
- optimal_reminder_frequency: How often to remind
- suggested_interventions: Specific actions to take`
          },
          {
            role: 'user',
            content: JSON.stringify(history)
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const prediction = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, prediction }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('No-show prediction error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
