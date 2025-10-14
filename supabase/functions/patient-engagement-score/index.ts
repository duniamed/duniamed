// UNLIMITED EDGE FUNCTION CAPACITIES: Patient Engagement Scoring
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
    const { patientId, timeframe } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const [appointments, messages, portal_logins] = await Promise.all([
      supabase.from('appointments').select('*').eq('patient_id', patientId),
      supabase.from('messages').select('*').eq('sender_id', patientId),
      supabase.from('audit_logs').select('*').eq('user_id', patientId).eq('action', 'portal_login')
    ]);

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
            content: 'Calculate patient engagement score. Return JSON: { "score": 0-100, "trend": "increasing|stable|decreasing", "engagementFactors": [], "recommendations": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ appointments: appointments.data, messages: messages.data, logins: portal_logins.data })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const engagement = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('patient_engagement_scores').upsert({
      patient_id: patientId,
      score: engagement.score,
      trend: engagement.trend,
      calculated_at: new Date().toISOString(),
      metadata: engagement
    });

    return new Response(JSON.stringify({ success: true, engagement }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Engagement scoring error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
