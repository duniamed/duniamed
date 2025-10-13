import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) throw new Error('Unauthorized');

    const { specialistId } = await req.json();

    console.log(`Calculating earnings forecast for specialist: ${specialistId}`);

    // Get specialist's completed appointments for last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: historicalAppts } = await supabase
      .from('appointments')
      .select('fee, scheduled_at, status, created_at')
      .eq('specialist_id', specialistId)
      .eq('status', 'completed')
      .gte('scheduled_at', threeMonthsAgo.toISOString())
      .order('scheduled_at', { ascending: true });

    // Get booked future appointments
    const { data: futureAppts } = await supabase
      .from('appointments')
      .select('fee, scheduled_at')
      .eq('specialist_id', specialistId)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString());

    // Calculate metrics
    const totalHistoricalRevenue = historicalAppts?.reduce((sum, apt) => sum + (apt.fee || 0), 0) || 0;
    const avgRevenuePerAppt = historicalAppts && historicalAppts.length > 0
      ? totalHistoricalRevenue / historicalAppts.length
      : 0;

    const appointmentsPerWeek = historicalAppts && historicalAppts.length > 0
      ? historicalAppts.length / 12 // ~12 weeks in 3 months
      : 0;

    // Calculate no-show rate
    const { data: allAppts } = await supabase
      .from('appointments')
      .select('status')
      .eq('specialist_id', specialistId)
      .gte('scheduled_at', threeMonthsAgo.toISOString());

    const noShowCount = allAppts?.filter(apt => apt.status === 'no_show').length || 0;
    const noShowRate = allAppts && allAppts.length > 0
      ? noShowCount / allAppts.length
      : 0;

    // Forecast next month earnings
    const forecastedAppointments = Math.round(appointmentsPerWeek * 4 * (1 - noShowRate));
    const forecastedRevenue = forecastedAppointments * avgRevenuePerAppt;

    // Calculate payment latency (simplified - assume 3-7 days)
    const avgPaymentLatency = 5;

    // Seasonal pattern detection (simplified)
    const seasonalMultiplier = 1.0; // In production, analyze historical patterns

    return new Response(
      JSON.stringify({
        forecast: {
          nextMonthRevenue: forecastedRevenue * seasonalMultiplier,
          confidenceScore: historicalAppts && historicalAppts.length >= 10 ? 85 : 60,
          expectedAppointments: forecastedAppointments,
          avgRevenuePerAppt,
          bookingVelocity: appointmentsPerWeek,
          noShowRate: Math.round(noShowRate * 100),
          paymentLatencyDays: avgPaymentLatency
        },
        historical: {
          last3MonthsRevenue: totalHistoricalRevenue,
          appointmentCount: historicalAppts?.length || 0,
          avgPerWeek: appointmentsPerWeek.toFixed(1)
        },
        futureBooked: {
          appointments: futureAppts?.length || 0,
          expectedRevenue: futureAppts?.reduce((sum, apt) => sum + (apt.fee || 0), 0) || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Earnings forecast error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
