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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { clinicId, dateRange, constraints } = await req.json();

    // Fetch historical appointment data
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', dateRange.start)
      .lte('scheduled_at', dateRange.end);

    // Fetch specialist availability
    const { data: specialists } = await supabase
      .from('specialists')
      .select('*, availability_schedules(*)')
      .eq('clinic_id', clinicId);

    // ML-based schedule optimization using Lovable AI
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
            content: `Optimize appointment scheduling using ML. Return JSON:
{
  "optimal_schedule": [
    {
      "specialist_id": "uuid",
      "time_slot": "ISO timestamp",
      "patient_id": "uuid",
      "confidence": 0-1,
      "reasoning": "string"
    }
  ],
  "efficiency_score": 0-100,
  "predicted_utilization": 0-100,
  "bottlenecks": ["string"],
  "recommendations": ["string"]
}`
          },
          {
            role: 'user',
            content: JSON.stringify({
              appointments,
              specialists,
              constraints,
              dateRange
            })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const optimization = JSON.parse(aiData.choices[0].message.content);

    // Calculate conflict resolution
    const conflicts = optimization.optimal_schedule.filter((slot: any) => {
      return appointments?.some((apt: any) => 
        apt.specialist_id === slot.specialist_id &&
        Math.abs(new Date(apt.scheduled_at).getTime() - new Date(slot.time_slot).getTime()) < 3600000
      );
    });

    return new Response(JSON.stringify({
      success: true,
      optimization,
      conflicts,
      stats: {
        total_slots: optimization.optimal_schedule.length,
        conflicts: conflicts.length,
        efficiency_gain: optimization.efficiency_score
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('ML schedule optimization error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
