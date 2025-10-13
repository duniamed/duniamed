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

    const { clinicId, startDate, endDate } = await req.json();

    console.log(`Generating ANS report for clinic ${clinicId} from ${startDate} to ${endDate}`);

    // Fetch clinic data
    const { data: clinic } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();

    if (!clinic) throw new Error('Clinic not found');

    // Fetch appointments in date range
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        *,
        specialists!appointments_specialist_id_fkey (
          license_number,
          specialty,
          profiles!specialists_user_id_fkey (first_name, last_name)
        ),
        profiles!appointments_patient_id_fkey (
          first_name,
          last_name,
          patient_number
        )
      `)
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate);

    // Generate ANS XML (TISS standard)
    const xmlReport = generateANSXML({
      clinic,
      appointments: appointments || [],
      periodStart: startDate,
      periodEnd: endDate
    });

    // Store report
    await supabase.from('legal_archives').insert({
      document_type: 'ans_report',
      document_data: { xml: xmlReport },
      entity_type: 'clinic',
      entity_id: clinicId,
      retention_years: 7,
      jurisdiction: 'Brazil',
      created_by: user.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        xml: xmlReport,
        summary: {
          clinicName: clinic.name,
          totalAppointments: appointments?.length || 0,
          periodStart: startDate,
          periodEnd: endDate
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('ANS report generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateANSXML(params: any): string {
  const { clinic, appointments, periodStart, periodEnd } = params;
  
  // Generate TISS-compliant ANS XML
  return `<?xml version="1.0" encoding="UTF-8"?>
<ans_report xmlns="http://www.ans.gov.br/tiss" version="3.05.00">
  <header>
    <clinic_code>${clinic.id.substring(0, 14)}</clinic_code>
    <clinic_name>${escapeXML(clinic.name)}</clinic_name>
    <cnpj>${clinic.cnpj || 'NOT_SET'}</cnpj>
    <period_start>${periodStart}</period_start>
    <period_end>${periodEnd}</period_end>
    <generation_date>${new Date().toISOString()}</generation_date>
  </header>
  <appointments count="${appointments.length}">
    ${appointments.map((apt: any) => `
    <appointment>
      <id>${apt.id}</id>
      <patient_number>${apt.profiles?.patient_number || 'N/A'}</patient_number>
      <specialist_license>${apt.specialists?.license_number || 'N/A'}</specialist_license>
      <date>${apt.scheduled_at}</date>
      <type>${apt.consultation_type}</type>
      <status>${apt.status}</status>
      <fee>${apt.fee}</fee>
      <duration_minutes>${apt.duration_minutes}</duration_minutes>
    </appointment>
    `).join('')}
  </appointments>
  <summary>
    <total_appointments>${appointments.length}</total_appointments>
    <total_revenue>${appointments.reduce((sum: number, apt: any) => sum + (apt.fee || 0), 0).toFixed(2)}</total_revenue>
    <avg_duration>${appointments.length > 0 ? (appointments.reduce((sum: number, apt: any) => sum + (apt.duration_minutes || 30), 0) / appointments.length).toFixed(0) : 0}</avg_duration>
  </summary>
</ans_report>`;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
