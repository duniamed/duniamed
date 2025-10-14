// UNLIMITED EDGE FUNCTION CAPACITIES: Predictive No-Show ML
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
    const { appointmentId, patientId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: history } = await supabase
      .from('appointments')
      .select('status, scheduled_at, reminder_sent')
      .eq('patient_id', patientId)
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
            content: 'Predict no-show probability based on patient history. Return JSON: { "noShowProbability": 0-1, "riskFactors": [], "interventionRecommendations": [], "confidence": 0-1 }'
          },
          {
            role: 'user',
            content: JSON.stringify({ history, appointmentId })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const prediction = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('ml_predictions').insert({
      entity_type: 'appointment',
      entity_id: appointmentId,
      prediction_type: 'no_show_risk',
      prediction_value: prediction.noShowProbability,
      confidence_score: prediction.confidence,
      metadata: prediction
    });

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
