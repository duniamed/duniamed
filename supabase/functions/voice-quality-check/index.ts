// UNLIMITED EDGE FUNCTION CAPACITIES: Voice Quality Check
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio_text, confidence_score } = await req.json();

    console.log(`Checking voice quality - confidence: ${confidence_score}`);

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
            content: `Analyze voice input quality and suggest clarifications. Return JSON with:
- quality_score: 0-100
- clarity_issues: Array of detected issues
- suggested_clarifications: Questions to ask for missing info
- is_complete: Boolean if input is medically complete`
          },
          {
            role: 'user',
            content: `Text: ${audio_text}\nConfidence: ${confidence_score}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const quality_analysis = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, quality_analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Voice quality check error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
