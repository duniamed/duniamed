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

    console.log(`Generating GDPR data export for user: ${user.id}`);

    // Fetch all user data
    const [profile, appointments, prescriptions, medicalRecords, activities, consents] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('appointments').select('*').eq('patient_id', user.id),
      supabase.from('prescriptions').select('*').eq('patient_id', user.id),
      supabase.from('medical_records').select('*').eq('patient_id', user.id),
      supabase.from('activities').select('*').eq('user_id', user.id),
      supabase.from('user_consents').select('*').eq('user_id', user.id)
    ]);

    // Compile complete data export
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        dataSubject: user.email,
        jurisdiction: 'EU',
        gdprArticle: 'Article 15 - Right of Access'
      },
      personalData: {
        profile: profile.data,
        appointments: appointments.data || [],
        prescriptions: prescriptions.data || [],
        medicalRecords: medicalRecords.data || [],
        activities: activities.data || [],
        consents: consents.data || []
      },
      dataProcessingInfo: {
        purposes: [
          'Healthcare service delivery',
          'Appointment scheduling',
          'Medical record management',
          'Communication and notifications'
        ],
        legalBasis: [
          'Consent (GDPR Article 6(1)(a))',
          'Contract performance (GDPR Article 6(1)(b))',
          'Legal obligation (GDPR Article 6(1)(c))'
        ],
        dataRetention: '7 years from last activity or as required by medical regulations',
        dataRecipients: [
          'Healthcare providers',
          'Payment processors (Stripe)',
          'Communication services (Twilio)',
          'Cloud infrastructure (Supabase)'
        ]
      },
      yourRights: {
        rightToAccess: 'You can request this export anytime',
        rightToRectification: 'Contact support to correct inaccurate data',
        rightToErasure: 'Request account deletion (subject to legal retention requirements)',
        rightToPortability: 'This JSON export enables data portability',
        rightToObject: 'Contact support to object to data processing',
        rightToWithdrawConsent: 'Manage consents in Privacy Settings'
      }
    };

    // Log the export request
    await supabase.from('security_audit_log').insert({
      user_id: user.id,
      action: 'gdpr_data_export',
      resource_type: 'user_data',
      resource_id: user.id,
      metadata: { exportSize: JSON.stringify(exportData).length },
      ip_address: req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent')
    });

    // Archive the export
    await supabase.from('legal_archives').insert({
      document_type: 'gdpr_export',
      document_data: exportData,
      entity_type: 'user',
      entity_id: user.id,
      retention_years: 1,
      jurisdiction: 'EU',
      created_by: user.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        exportData,
        downloadUrl: null, // In production, generate signed URL
        expiresIn: '72 hours'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('GDPR export error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
