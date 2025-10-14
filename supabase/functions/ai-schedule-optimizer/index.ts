// UNLIMITED EDGE FUNCTION CAPACITIES: AI Schedule Optimizer
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
    const { specialist_id, date_range } = await req.json();

    console.log(`Optimizing schedule for specialist: ${specialist_id}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch current schedule
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('specialist_id', specialist_id)
      .gte('scheduled_at', date_range.start)
      .lte('scheduled_at', date_range.end);

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
            content: `Optimize specialist schedule. Return JSON with:
- optimized_slots: Array of optimized time slots
- efficiency_score: 0-100
- recommendations: Actionable improvements
- buffer_time_suggestions: Recommended buffer times
- revenue_optimization: Revenue impact analysis`
          },
          {
            role: 'user',
            content: `Current appointments: ${JSON.stringify(appointments)}\nDate range: ${JSON.stringify(date_range)}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const optimization = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, optimization }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('AI schedule optimizer error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
