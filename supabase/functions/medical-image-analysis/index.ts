// UNLIMITED EDGE FUNCTION CAPACITIES: Medical Image Analysis
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
    const { imageUrl, imageType, patientId, clinicalContext } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Analyzing medical image:', { imageType, patientId });

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
            content: 'Analyze medical images (X-ray, CT, MRI, ultrasound). Return JSON: { "findings": [], "abnormalities": [], "severity": "", "recommendations": [], "confidence": 0-1, "requiresUrgentReview": false, "suggestedFollowUp": "", "comparisonNeeded": false, "measurementsDetected": {} }'
          },
          {
            role: 'user',
            content: JSON.stringify({ imageUrl, imageType, patientId, clinicalContext })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    await supabase
      .from('medical_image_analyses')
      .insert({
        patient_id: patientId,
        image_url: imageUrl,
        image_type: imageType,
        findings: analysis.findings,
        abnormalities: analysis.abnormalities,
        severity: analysis.severity,
        ai_confidence: analysis.confidence,
        requires_urgent_review: analysis.requiresUrgentReview
      });

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Medical image analysis error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
