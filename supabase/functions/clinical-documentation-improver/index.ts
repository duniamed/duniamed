// UNLIMITED EDGE FUNCTION CAPACITIES: Clinical Documentation Improvement
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
    const { appointmentId, clinicalNotes, diagnosis, procedures } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
            content: 'Improve clinical documentation quality and completeness. Return JSON: { "improvementSuggestions": [], "missingElements": [], "clarityScore": 0-100, "completenessScore": 0-100, "complianceFlags": [], "specificityImprovements": [], "billingOptimization": [], "qualityMetrics": {}, "suggestedAdditions": [], "riskFlags": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ clinicalNotes, diagnosis, procedures })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const improvements = JSON.parse(aiData.choices[0].message.content);

    await supabase
      .from('documentation_quality_logs')
      .insert({
        appointment_id: appointmentId,
        clarity_score: improvements.clarityScore,
        completeness_score: improvements.completenessScore,
        missing_elements: improvements.missingElements,
        suggestions: improvements.improvementSuggestions
      });

    return new Response(JSON.stringify({ success: true, improvements }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Clinical documentation improvement error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
