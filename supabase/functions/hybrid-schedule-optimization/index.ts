// UNLIMITED EDGE FUNCTION CAPACITIES: Hybrid Scheduling (In-Person + Telehealth)
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

    const { specialistId, clinicId, date, preferences } = await req.json();

    console.log(`Optimizing hybrid schedule for specialist ${specialistId} on ${date}`);

    // Get existing appointments for the date
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('specialist_id', specialistId)
      .gte('scheduled_at', `${date}T00:00:00`)
      .lt('scheduled_at', `${date}T23:59:59`)
      .order('scheduled_at');

    // Get clinic resources availability
    const { data: resources } = await supabase
      .from('clinic_resources')
      .select('id, name, resource_type')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    // Calculate optimal schedule blocks
    const scheduleBlocks: any[] = [];
    const workDayStart = new Date(`${date}T08:00:00`);
    const workDayEnd = new Date(`${date}T18:00:00`);
    
    let currentTime = workDayStart;

    // Group appointments by modality
    const inPersonAppointments = appointments?.filter(apt => apt.modality === 'in_person') || [];
    const telehealthAppointments = appointments?.filter(apt => apt.modality === 'telehealth') || [];

    // Optimize: Group in-person appointments together to minimize transitions
    if (inPersonAppointments.length > 0) {
      scheduleBlocks.push({
        type: 'in_person_block',
        start_time: inPersonAppointments[0].scheduled_at,
        end_time: inPersonAppointments[inPersonAppointments.length - 1].scheduled_at,
        appointments: inPersonAppointments,
        resource_needed: true
      });
    }

    // Fill gaps with telehealth appointments
    for (const tele of telehealthAppointments) {
      scheduleBlocks.push({
        type: 'telehealth_block',
        start_time: tele.scheduled_at,
        end_time: new Date(new Date(tele.scheduled_at).getTime() + (tele.duration_minutes || 30) * 60000),
        appointments: [tele],
        resource_needed: false
      });
    }

    // Calculate optimization metrics
    const totalAppointments = appointments?.length || 0;
    const inPersonCount = inPersonAppointments.length;
    const telehealthCount = telehealthAppointments.length;
    const transitions = scheduleBlocks.length - 1;

    // AI-powered suggestions
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    let aiSuggestions: any = null;

    if (lovableApiKey) {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'system',
            content: 'You are a healthcare scheduling optimization AI. Analyze the schedule and provide suggestions to minimize specialist fatigue and maximize efficiency.'
          }, {
            role: 'user',
            content: `Schedule analysis:
- Total appointments: ${totalAppointments}
- In-person: ${inPersonCount}
- Telehealth: ${telehealthCount}
- Modality transitions: ${transitions}
- Blocks: ${JSON.stringify(scheduleBlocks)}

Provide optimization suggestions as JSON with: suggested_breaks, reorder_recommendations, efficiency_score (0-100)`
          }],
          response_format: { type: 'json_object' }
        }),
      });

      const aiData = await aiResponse.json();
      aiSuggestions = JSON.parse(aiData.choices[0].message.content);
    }

    return new Response(JSON.stringify({
      success: true,
      schedule_blocks: scheduleBlocks,
      metrics: {
        total_appointments: totalAppointments,
        in_person_count: inPersonCount,
        telehealth_count: telehealthCount,
        modality_transitions: transitions,
        efficiency_score: aiSuggestions?.efficiency_score || 75
      },
      ai_suggestions: aiSuggestions,
      recommendations: [
        transitions > 3 ? 'Consider grouping similar appointment types together' : null,
        inPersonCount > 8 ? 'High in-person load - ensure adequate breaks' : null,
        telehealthCount > 12 ? 'Consider limiting consecutive telehealth slots' : null
      ].filter(Boolean)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Hybrid schedule optimization error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
