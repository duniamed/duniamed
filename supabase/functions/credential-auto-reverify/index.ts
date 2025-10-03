import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Running credential auto-reverification');

    // Find credentials expiring soon or expired
    const expiryThreshold = new Date();
    expiryThreshold.setMonth(expiryThreshold.getMonth() + 1); // 1 month warning

    const { data: specialists, error: fetchError } = await supabase
      .from('specialists')
      .select(`
        *,
        user:profiles!specialists_user_id_fkey(id, email, first_name, last_name),
        credentials:specialist_credentials(*)
      `)
      .or(`
        license_expiry.lte.${expiryThreshold.toISOString()},
        credentials.expires_at.lte.${expiryThreshold.toISOString()}
      `);

    if (fetchError) throw fetchError;

    console.log(`Found ${specialists?.length || 0} specialists needing reverification`);

    const results = {
      notified: 0,
      verified: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const specialist of specialists || []) {
      try {
        // Check each credential
        for (const credential of specialist.credentials || []) {
          if (credential.expires_at && new Date(credential.expires_at) <= expiryThreshold) {
            
            // Attempt auto-verification via external API
            let verificationStatus = 'needs_renewal';
            
            try {
              const { data: verifyResult } = await supabase.functions.invoke('verify-credentials', {
                body: {
                  specialist_id: specialist.id,
                  credential_type: credential.credential_type,
                  credential_number: credential.credential_number,
                  license_country: specialist.license_country
                }
              });

              if (verifyResult?.verified) {
                verificationStatus = 'verified';
                
                // Update credential
                await supabase
                  .from('specialist_credentials')
                  .update({
                    verification_status: 'verified',
                    verified_at: new Date().toISOString(),
                    expires_at: verifyResult.new_expiry_date
                  })
                  .eq('id', credential.id);

                results.verified++;
              }
            } catch (verifyError) {
              console.error('Auto-verification failed:', verifyError);
              // Continue to notify user
            }

            // Notify specialist
            const daysUntilExpiry = Math.ceil(
              (new Date(credential.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            const isExpired = daysUntilExpiry <= 0;

            await supabase.from('user_notifications').insert({
              user_id: specialist.user_id,
              notification_type: isExpired ? 'credential_expired' : 'credential_expiring',
              title: isExpired ? 'Credential Expired' : 'Credential Expiring Soon',
              message: isExpired 
                ? `Your ${credential.credential_type} has expired. Please upload a renewed version immediately to continue practicing.`
                : `Your ${credential.credential_type} expires in ${daysUntilExpiry} days. Please upload a renewed version.`,
              action_url: '/credential-verification',
              metadata: {
                credential_id: credential.id,
                credential_type: credential.credential_type,
                expires_at: credential.expires_at,
                days_until_expiry: daysUntilExpiry
              }
            });

            // Send email notification
            await supabase.functions.invoke('send-email', {
              body: {
                to: specialist.user.email,
                subject: isExpired ? 'Action Required: Credential Expired' : 'Reminder: Credential Expiring Soon',
                html: `
                  <h2>Credential ${isExpired ? 'Expired' : 'Expiring Soon'}</h2>
                  <p>Dear Dr. ${specialist.user.first_name} ${specialist.user.last_name},</p>
                  <p>Your ${credential.credential_type} ${isExpired ? 'has expired' : `expires in ${daysUntilExpiry} days`}.</p>
                  <p><strong>Credential Details:</strong></p>
                  <ul>
                    <li>Type: ${credential.credential_type}</li>
                    <li>Number: ${credential.credential_number}</li>
                    <li>Expiry: ${new Date(credential.expires_at).toLocaleDateString()}</li>
                  </ul>
                  <p>Please upload your renewed credential as soon as possible to maintain your active status.</p>
                  <p><a href="${supabaseUrl}/credential-verification">Update Credentials</a></p>
                `
              }
            });

            results.notified++;

            // If expired, update specialist status
            if (isExpired) {
              await supabase
                .from('specialists')
                .update({
                  verification_status: 'expired',
                  is_accepting_patients: false
                })
                .eq('id', specialist.id);

              // Cancel future appointments
              await supabase
                .from('appointments')
                .update({
                  status: 'cancelled',
                  cancellation_reason: 'Specialist credential expired - appointment automatically cancelled'
                })
                .eq('specialist_id', specialist.id)
                .eq('status', 'confirmed')
                .gt('scheduled_at', new Date().toISOString());
            }
          }
        }

      } catch (error) {
        results.failed++;
        results.errors.push({
          specialist_id: specialist.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Failed to process specialist ${specialist.id}:`, error);
      }
    }

    console.log('Auto-reverification complete:', results);

    return new Response(JSON.stringify({
      success: true,
      results,
      processed: specialists?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in credential-auto-reverify:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
