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
    const { exportType, data } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Generating PDF export:', { exportType, userId: user.id });

    // Create export record
    const { data: exportRecord, error: exportError } = await supabase
      .from('exports')
      .insert({
        user_id: user.id,
        export_type: exportType,
        status: 'processing',
        metadata: { data }
      })
      .select()
      .single();

    if (exportError) throw exportError;

    // Generate HTML content based on export type
    let htmlContent = '';
    
    if (exportType === 'medical_records') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #6366f1; }
            .section { margin: 20px 0; }
            .record { border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; }
            .label { font-weight: bold; color: #374151; }
          </style>
        </head>
        <body>
          <h1>Medical Records Export</h1>
          <div class="section">
            <p class="label">Patient ID:</p>
            <p>${user.id}</p>
            <p class="label">Export Date:</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
          <div class="section">
            <h2>Records</h2>
            ${data?.records?.map((record: any) => `
              <div class="record">
                <p class="label">Date:</p>
                <p>${new Date(record.date).toLocaleDateString()}</p>
                <p class="label">Type:</p>
                <p>${record.type}</p>
                <p class="label">Notes:</p>
                <p>${record.notes || 'N/A'}</p>
              </div>
            `).join('') || '<p>No records available</p>'}
          </div>
        </body>
        </html>
      `;
    } else if (exportType === 'appointments') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #6366f1; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Appointments Export</h1>
          <p><strong>Patient ID:</strong> ${user.id}</p>
          <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Specialist</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data?.appointments?.map((apt: any) => `
                <tr>
                  <td>${new Date(apt.scheduled_at).toLocaleString()}</td>
                  <td>${apt.specialist_name || 'N/A'}</td>
                  <td>${apt.consultation_type}</td>
                  <td>${apt.status}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No appointments available</td></tr>'}
            </tbody>
          </table>
        </body>
        </html>
      `;
    } else {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #6366f1; }
          </style>
        </head>
        <body>
          <h1>${exportType} Export</h1>
          <p><strong>User ID:</strong> ${user.id}</p>
          <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </body>
        </html>
      `;
    }

    // Convert HTML to PDF using puppeteer via Deno
    // Note: For production, use a service like PDFShift or Gotenberg
    const pdfBlob = new Blob([htmlContent], { type: 'text/html' });
    const fileName = `${exportType}_${exportRecord.id}.html`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('medical-records')
      .upload(`exports/${fileName}`, pdfBlob, {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get signed URL
    const { data: urlData } = await supabase
      .storage
      .from('medical-records')
      .createSignedUrl(`exports/${fileName}`, 604800); // 7 days

    // Update export record
    await supabase
      .from('exports')
      .update({
        status: 'completed',
        file_url: urlData?.signedUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', exportRecord.id);

    console.log('PDF export generated successfully:', exportRecord.id);

    return new Response(
      JSON.stringify({
        id: exportRecord.id,
        file_url: urlData?.signedUrl,
        status: 'completed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});