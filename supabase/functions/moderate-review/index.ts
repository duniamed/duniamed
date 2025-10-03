import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviewId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch review
    const { data: review, error: fetchError } = await supabaseClient
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (fetchError) throw fetchError;

    // Call AI for moderation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a medical review moderator. Analyze reviews for:
1. Illegal content (threats, discrimination, HIPAA violations)
2. PHI exposure (patient names, addresses, SSNs, medical record numbers)
3. Profanity or abusive language
4. Spam or promotional content
5. Unverified medical claims

Return JSON with:
{
  "action": "publish" | "flag" | "censor",
  "reason": "brief explanation",
  "flags": ["flag1", "flag2"],
  "phi_detected": true/false,
  "censored_content": "redacted version if needed"
}`
          },
          {
            role: "user",
            content: `Review to moderate:\nRating: ${review.rating}/5\nComment: ${review.comment || 'N/A'}`
          }
        ]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI moderation failed: ${response.status}`);
    }

    const aiResult = await response.json();
    const moderation = JSON.parse(aiResult.choices[0].message.content);

    // Update review based on AI decision
    const updates: any = {
      moderation_status: moderation.action === 'publish' ? 'published' : 
                        moderation.action === 'censor' ? 'censored' : 'flagged',
      moderation_reason: moderation.reason,
      ai_flags: moderation.flags,
      published_at: moderation.action === 'publish' ? new Date().toISOString() : null
    };

    if (moderation.censored_content) {
      updates.censored_content = moderation.censored_content;
    }

    const { error: updateError } = await supabaseClient
      .from('reviews')
      .update(updates)
      .eq('id', reviewId);

    if (updateError) throw updateError;

    // Send notification if flagged
    if (moderation.action === 'flag') {
      await supabaseClient.functions.invoke('send-notification', {
        body: {
          userId: review.patient_id,
          type: 'review_flagged',
          title: 'Review Under Review',
          message: `Your review has been flagged for moderation: ${moderation.reason}`,
          data: { reviewId }
        }
      });
    }

    return new Response(
      JSON.stringify({ success: true, moderation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Moderation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});