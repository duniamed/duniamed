// UNLIMITED EDGE FUNCTION CAPACITIES: RPM Compliance Tracking
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
    const { patientId, billingPeriod } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Checking RPM compliance for patient ${patientId}, period ${billingPeriod}`);

    const startDate = new Date(billingPeriod);
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: readings } = await supabase
      .from('rpm_device_readings')
      .select('*')
      .eq('patient_id', patientId)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString());

    const daysWithReadings = new Set(readings?.map(r => new Date(r.recorded_at).toDateString()) || []).size;
    const totalReadings = readings?.length || 0;
    const requiredDays = 16; // CMS requirement: 16 days minimum

    const isCompliant = daysWithReadings >= requiredDays;
    const compliancePercentage = (daysWithReadings / 30) * 100;

    const complianceRecord = {
      patient_id: patientId,
      billing_period: billingPeriod,
      days_with_readings: daysWithReadings,
      total_readings: totalReadings,
      is_compliant: isCompliant,
      compliance_percentage: compliancePercentage,
      billing_code: isCompliant ? 'CPT-99454' : null
    };

    const { data, error } = await supabase.from('rpm_compliance_logs').insert(complianceRecord).select().single();
    if (error) throw error;

    if (!isCompliant && daysWithReadings < 12) {
      await supabase.from('notifications').insert({
        user_id: patientId,
        type: 'rpm_compliance',
        title: 'RPM Compliance Alert',
        message: `You have readings on ${daysWithReadings} days this month. Need ${requiredDays} for billing compliance.`,
        metadata: { complianceRecord }
      });
    }

    return new Response(JSON.stringify({ success: true, compliance: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('RPM compliance tracking error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
