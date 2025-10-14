// UNLIMITED EDGE FUNCTION CAPACITIES: Staff Utilization Tracker
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
    const { clinic_id, date_range } = await req.json();

    console.log(`Tracking staff utilization for clinic: ${clinic_id}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch staff and their assignments
    const { data: staff } = await supabase
      .from('clinic_staff')
      .select('*, specialists(*), appointments(*)')
      .eq('clinic_id', clinic_id);

    const utilization = staff?.map(member => {
      const appointments = member.appointments || [];
      const totalMinutes = appointments.reduce((acc: number, a: any) => acc + (a.duration_minutes || 0), 0);
      const workHours = 8 * 60; // 8 hours per day
      
      return {
        staff_id: member.id,
        staff_name: `${member.user_id}`,
        utilization_percentage: (totalMinutes / workHours) * 100,
        total_appointments: appointments.length,
        total_hours: totalMinutes / 60,
        idle_time: workHours - totalMinutes
      };
    });

    return new Response(JSON.stringify({ success: true, utilization }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Staff utilization tracker error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
