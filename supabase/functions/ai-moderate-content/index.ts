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
    const { content, contentType, contentId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Use Grok for AI moderation
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROK_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [{
          role: 'system',
          content: `You are a HIPAA-compliant content moderator. Analyze the content for:
1. PHI (Protected Health Information): Names, addresses, phone numbers, SSN, medical record numbers, dates of birth
2. Toxicity: Harassment, threats, hate speech, inappropriate language
3. Inappropriate content: Spam, scams, misleading medical advice

Return JSON with:
{
  "phiDetected": [{"type": "name", "value": "John Doe", "confidence": 0.95}],
  "toxicityScore": 0.2,
  "moderationAction": "allow|redact|block",
  "redactedContent": "content with PHI removed",
  "reasoning": "brief explanation"
}`
        }, {
          role: 'user',
          content: content
        }],
        temperature: 0.1
      })
    });

    if (!grokResponse.ok) {
      throw new Error('Grok moderation failed');
    }

    const grokData = await grokResponse.json();
    const moderationResult = JSON.parse(grokData.choices[0].message.content);

    // Log moderation
    const { error: logError } = await supabase
      .from('moderation_logs')
      .insert({
        content_type: contentType,
        content_id: contentId,
        original_content: content,
        redacted_content: moderationResult.redactedContent,
        phi_detected: moderationResult.phiDetected,
        toxicity_score: moderationResult.toxicityScore,
        moderation_action: moderationResult.moderationAction
      });

    if (logError) console.error('Log error:', logError);

    return new Response(
      JSON.stringify(moderationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Moderation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
