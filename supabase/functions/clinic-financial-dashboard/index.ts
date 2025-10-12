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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { clinicId, startDate, endDate } = await req.json();

    console.log(`Generating financial dashboard for clinic: ${clinicId}`);

    // Get clinic ownership verification
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, name')
      .eq('id', clinicId)
      .eq('created_by', user.id)
      .single();

    if (!clinic) {
      return new Response(JSON.stringify({ error: 'Unauthorized clinic access' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get appointments with revenue data
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        fee,
        status,
        consultation_type,
        specialist_id,
        currency
      `)
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate);

    // Get transactions/payments
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Calculate metrics
    const totalAppointments = appointments?.length || 0;
    const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
    const grossRevenue = appointments?.reduce((sum, a) => sum + (parseFloat(a.fee) || 0), 0) || 0;
    const collectedRevenue = transactions?.filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;
    const pendingRevenue = grossRevenue - collectedRevenue;

    // Revenue by specialist
    const revenueBySpecialist = appointments?.reduce((acc: any, apt) => {
      const specId = apt.specialist_id;
      if (!acc[specId]) {
        acc[specId] = { appointments: 0, revenue: 0 };
      }
      acc[specId].appointments++;
      acc[specId].revenue += parseFloat(apt.fee) || 0;
      return acc;
    }, {}) || {};

    // Revenue by consultation type
    const revenueByType = appointments?.reduce((acc: any, apt) => {
      const type = apt.consultation_type || 'unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, revenue: 0 };
      }
      acc[type].count++;
      acc[type].revenue += parseFloat(apt.fee) || 0;
      return acc;
    }, {}) || {};

    // Daily revenue breakdown
    const dailyRevenue = appointments?.reduce((acc: any, apt) => {
      const date = new Date(apt.scheduled_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { appointments: 0, revenue: 0 };
      }
      acc[date].appointments++;
      acc[date].revenue += parseFloat(apt.fee) || 0;
      return acc;
    }, {}) || {};

    return new Response(JSON.stringify({
      success: true,
      metrics: {
        totalAppointments,
        completedAppointments,
        grossRevenue,
        collectedRevenue,
        pendingRevenue,
        conversionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments * 100) : 0
      },
      breakdown: {
        bySpecialist: revenueBySpecialist,
        byType: revenueByType,
        daily: dailyRevenue
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Financial dashboard error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});