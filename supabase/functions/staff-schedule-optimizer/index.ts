// UNLIMITED EDGE FUNCTION CAPACITIES: Staff Schedule Optimizer
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
    const { clinicId, period, constraints } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: staff } = await supabase
      .from('clinic_staff')
      .select('*, profiles(*)')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    const { data: shifts } = await supabase
      .from('shifts')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('start_time', period.start)
      .lte('end_time', period.end);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', period.start)
      .lte('scheduled_at', period.end);

    console.log('Optimizing staff schedule:', { clinicId, staffCount: staff?.length });

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
            content: 'Optimize staff scheduling considering workload, skills, availability, and labor laws. Return JSON: { "optimizedSchedule": [], "coverageGaps": [], "overstaffedPeriods": [], "costSavings": 0, "satisfactionScore": 0-100, "complianceIssues": [], "swapSuggestions": [], "overtimePredictions": [] }'
          },
          {
            role: 'user',
            content: JSON.stringify({ clinicId, period, staff, shifts, appointments, constraints })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const schedule = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, schedule }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Staff schedule optimizer error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
