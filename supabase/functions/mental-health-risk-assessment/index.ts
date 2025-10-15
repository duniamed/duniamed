// UNLIMITED EDGE FUNCTION CAPACITIES: Mental Health Risk Assessment
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
    const { patient_id, assessment_data, assessment_type } = await req.json();

    console.log(`Mental health assessment for patient: ${patient_id}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch previous assessments
    const { data: previousAssessments } = await supabase
      .from('mental_health_assessments')
      .select('*')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false })
      .limit(5);

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
            content: `Analyze mental health assessment data. Return JSON with:
- risk_level: Low, moderate, high, critical
- risk_factors: Identified risk factors
- symptoms: Current symptoms and severity
- dsm_considerations: DSM-5 diagnostic considerations
- interventions: Recommended interventions
- referral_urgency: Immediate, urgent, routine
- safety_concerns: Any immediate safety risks
- treatment_recommendations: Therapeutic recommendations
- follow_up_timeline: Recommended follow-up schedule
- support_resources: Relevant support resources`
          },
          {
            role: 'user',
            content: JSON.stringify({ 
              assessment_data, 
              assessment_type,
              previous_assessments: previousAssessments 
            })
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const assessment = JSON.parse(aiData.choices[0].message.content);

    // Store assessment
    const { data: stored } = await supabase.from('mental_health_assessments').insert({
      patient_id,
      assessment_type,
      assessment_result: assessment,
      risk_level: assessment.risk_level,
      created_at: new Date().toISOString()
    }).select().single();

    // Create alert if high risk
    if (assessment.risk_level === 'high' || assessment.risk_level === 'critical') {
      await supabase.from('notifications').insert({
        user_id: patient_id,
        type: 'mental_health_alert',
        title: 'Mental Health Assessment Alert',
        message: `Risk level: ${assessment.risk_level}. Immediate follow-up recommended.`,
        priority: 'high'
      });
    }

    return new Response(JSON.stringify({ success: true, assessment, assessment_id: stored.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Mental health assessment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});