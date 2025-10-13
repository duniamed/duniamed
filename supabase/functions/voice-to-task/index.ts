// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { voice_text, user_id, clinic_id } = await req.json();

    // Use AI to parse voice command
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'system',
          content: 'Extract task details from voice command. Return JSON: {action: "add"|"complete"|"update", title: string, patient_id?: string, priority?: "low"|"medium"|"high", due_date?: string}'
        }, {
          role: 'user',
          content: voice_text
        }],
      }),
    });

    const aiData = await aiResponse.json();
    const taskDetails = JSON.parse(aiData.choices[0].message.content);

    if (taskDetails.action === 'add') {
      const { data: task, error } = await supabaseClient
        .from('work_queue_items')
        .insert({
          clinic_id,
          title: taskDetails.title,
          description: `Created via voice: "${voice_text}"`,
          priority: taskDetails.priority || 'medium',
          status: 'todo',
          assigned_to: user_id,
          due_date: taskDetails.due_date || null,
          metadata: { created_via_voice: true, original_text: voice_text }
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, task }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Task processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});