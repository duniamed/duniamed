// UNLIMITED EDGE FUNCTION CAPACITIES: Patient Engagement Analytics
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
    const { patientId, period } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .gte('scheduled_at', period.start)
      .lte('scheduled_at', period.end);

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', patientId)
      .gte('created_at', period.start);

    console.log('Analyzing patient engagement:', { patientId, appointmentCount: appointments?.length });

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
            content: 'Analyze patient engagement patterns. Return JSON: { "engagementScore": 0-100, "appointmentAdherence": 0-100, "communicationFrequency": "", "responseTime": "", "trends": [], "riskFactors": [], "recommendations": [], "predictedChurn": 0-1, "satisfactionEstimate": 0-5 }'
          },
          {
            role: 'user',
            content: JSON.stringify({ patientId, appointments, messages, period })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const analytics = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, analytics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Patient engagement analytics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
