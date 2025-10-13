// UNLIMITED EDGE FUNCTION CAPACITIES: Generate Daily Schedule Snapshot
// Core Principle: Real-time schedule optimization with earnings forecast

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { specialistId, date } = await req.json();
    const targetDate = date || new Date().toISOString().split('T')[0];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all appointments for the day
    const { data: appointments, error: apptsError } = await supabase
      .from('appointments')
      .select(`
        *,
        profiles!patient_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('specialist_id', specialistId)
      .gte('scheduled_at', `${targetDate}T00:00:00Z`)
      .lt('scheduled_at', `${targetDate}T23:59:59Z`)
      .order('scheduled_at', { ascending: true });

    if (apptsError) throw apptsError;

    // Calculate statistics
    const stats = {
      total: appointments?.length || 0,
      completed: appointments?.filter(a => a.status === 'completed').length || 0,
      cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
      no_show: appointments?.filter(a => a.status === 'no_show').length || 0,
      upcoming: appointments?.filter(a => a.status === 'pending' || a.status === 'confirmed').length || 0
    };

    // Calculate earnings
    const { data: transactions } = await supabase
      .from('booking_transactions')
      .select('amount, status')
      .in('appointment_id', appointments?.map(a => a.id) || []);

    const projected = appointments?.reduce((sum, a) => sum + (a.fee || 0), 0) || 0;
    const actual = transactions?.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0) || 0;

    // Build schedule data with time slots
    const scheduleData = {
      appointments: appointments?.map(apt => ({
        id: apt.id,
        time: apt.scheduled_at,
        duration: apt.duration_minutes || 30,
        patient: {
          name: `${apt.profiles?.first_name} ${apt.profiles?.last_name}`,
          avatar: apt.profiles?.avatar_url
        },
        type: apt.consultation_type,
        status: apt.status,
        fee: apt.fee
      })) || [],
      stats
    };

    // Update or create cache
    const { data: cached, error: cacheError } = await supabase
      .from('daily_schedule_cache')
      .upsert({
        specialist_id: specialistId,
        date: targetDate,
        schedule_data: scheduleData,
        total_appointments: stats.total,
        completed_count: stats.completed,
        cancelled_count: stats.cancelled,
        no_show_count: stats.no_show,
        projected_earnings: projected,
        actual_earnings: actual,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'specialist_id,date'
      })
      .select()
      .single();

    if (cacheError) throw cacheError;

    console.log(`Schedule snapshot generated for specialist ${specialistId} on ${targetDate}`);

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: cached,
        recommendations: {
          overbooking: stats.upcoming > 15 ? 'Consider blocking time for breaks' : null,
          noShowRate: stats.total > 0 ? (stats.no_show / stats.total * 100).toFixed(1) + '%' : '0%'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-daily-schedule-snapshot:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});