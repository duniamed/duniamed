// UNLIMITED EDGE FUNCTION CAPACITIES: Patient Journey Analytics
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
    const { patientId, journeyType, timeframe } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false });

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', patientId);

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', patientId);

    console.log('Analyzing patient journey:', { patientId, appointmentCount: appointments?.length });

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: 'Map complete patient journey across touchpoints. Return JSON: { "journeyStages": [], "touchpoints": [], "frictionPoints": [], "satisfactionScore": 0-100, "conversionFunnels": {}, "dropoffAnalysis": [], "engagementPatterns": [], "timeToResolution": 0, "channelPreferences": [], "nextBestActions": [], "journeyOptimizations": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ patientId, journeyType, timeframe, appointments, messages, activities })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const journeyAnalytics = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, journeyAnalytics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Patient journey analytics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
