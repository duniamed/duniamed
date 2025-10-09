import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userActivity, context } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Generating AI recommendations for user:', user.id);

    // Call Lovable AI for recommendations
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a medical recommendation system. Based on user activity and context, recommend relevant specialists, clinics, or services. Return recommendations as JSON array with fields: item_type, item_id, score (0-100), and reason.'
          },
          {
            role: 'user',
            content: `User activity: ${JSON.stringify(userActivity)}\nContext: ${context || 'general'}\n\nProvide 5 personalized recommendations.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'provide_recommendations',
            description: 'Return a list of recommendations',
            parameters: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      item_type: { type: 'string', enum: ['specialist', 'clinic', 'service', 'article'] },
                      item_id: { type: 'string' },
                      score: { type: 'number', minimum: 0, maximum: 100 },
                      reason: { type: 'string' }
                    },
                    required: ['item_type', 'item_id', 'score', 'reason']
                  }
                }
              },
              required: ['recommendations']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'provide_recommendations' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    const recommendations = toolCall ? JSON.parse(toolCall.function.arguments).recommendations : [];

    // Store recommendations in database
    const recommendationsToInsert = recommendations.map((rec: any) => ({
      user_id: user.id,
      item_type: rec.item_type,
      item_id: rec.item_id,
      score: rec.score,
      reason: rec.reason,
      metadata: { context, generated_at: new Date().toISOString() },
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    }));

    const { data: insertedRecs, error: insertError } = await supabase
      .from('recommendations')
      .insert(recommendationsToInsert)
      .select();

    if (insertError) {
      console.error('Error storing recommendations:', insertError);
      throw insertError;
    }

    console.log('Recommendations generated and stored:', insertedRecs.length);

    return new Response(
      JSON.stringify({ recommendations: insertedRecs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});