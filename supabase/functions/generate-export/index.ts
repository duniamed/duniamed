import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, exportType, dataFormat } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating data export:', { userId, exportType, dataFormat });

    // Create export job
    const { data: job, error: jobError } = await supabase
      .from('data_export_jobs')
      .insert({
        user_id: userId,
        export_type: exportType,
        data_format: dataFormat,
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Fetch user data based on export type
    let exportData: any = {};

    if (exportType === 'patient_records') {
      // Fetch medical records
      const { data: records } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', userId);

      // Fetch appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', userId);

      // Fetch prescriptions
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', userId);

      exportData = {
        resourceType: 'Bundle',
        type: 'collection',
        entry: [
          ...(records || []).map(r => ({
            resource: {
              resourceType: 'DocumentReference',
              id: r.id,
              status: 'current',
              content: [{
                attachment: {
                  url: r.file_url,
                  title: r.record_type
                }
              }]
            }
          })),
          ...(appointments || []).map(a => ({
            resource: {
              resourceType: 'Appointment',
              id: a.id,
              status: a.status,
              start: a.scheduled_at,
              minutesDuration: a.duration_minutes
            }
          })),
          ...(prescriptions || []).map(p => ({
            resource: {
              resourceType: 'MedicationRequest',
              id: p.id,
              status: p.status,
              medicationCodeableConcept: {
                text: p.medication_name
              }
            }
          }))
        ]
      };
    }

    // Generate export file
    const exportContent = dataFormat === 'fhir_json' 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData); // Add CSV/PDF conversion here

    // Upload to storage
    const fileName = `export_${job.id}.${dataFormat === 'fhir_json' ? 'json' : dataFormat}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('medical-records')
      .upload(`exports/${fileName}`, exportContent, {
        contentType: 'application/json'
      });

    if (uploadError) throw uploadError;

    // Generate secure link
    const { data: urlData } = await supabase
      .storage
      .from('medical-records')
      .createSignedUrl(`exports/${fileName}`, 604800); // 7 days

    // Update job with results
    await supabase
      .from('data_export_jobs')
      .update({
        status: 'completed',
        export_url: urlData?.signedUrl,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log('Export generated successfully:', job.id);

    return new Response(
      JSON.stringify({
        job_id: job.id,
        export_url: urlData?.signedUrl,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating export:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
