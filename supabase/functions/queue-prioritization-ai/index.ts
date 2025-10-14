// UNLIMITED EDGE FUNCTION CAPACITIES: Queue Prioritization AI
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
    const { queue_items, context } = await req.json();

    console.log(`Prioritizing ${queue_items.length} queue items`);

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
            content: `Prioritize queue items. Return JSON with:
- prioritized_queue: Array of items with priority_score (0-100)
- reasoning: Explanation for each priority
- urgent_items: Items requiring immediate attention
- defer_items: Items that can be deferred
- estimated_completion_times: Time estimates per item`
          },
          {
            role: 'user',
            content: `Queue: ${JSON.stringify(queue_items)}\nContext: ${JSON.stringify(context)}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const prioritization = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, prioritization }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Queue prioritization error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
