// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { temp_email, file_data, file_name, content_type } = await req.json();

    // Find patient from temp email
    const { data: tempEmail } = await supabaseClient
      .from('temp_prescription_emails')
      .select('patient_id')
      .eq('temp_email', temp_email)
      .eq('status', 'active')
      .single();

    if (!tempEmail) {
      throw new Error('Invalid or expired email address');
    }

    // Use AI to parse prescription (OCR + classification)
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'system',
          content: 'Extract prescription details from image/document. Return JSON: {medication_name: string, dosage: string, frequency: string, duration?: string, prescriber?: string}'
        }, {
          role: 'user',
          content: `Parse prescription from file: ${file_name}`
        }],
      }),
    });

    const aiData = await aiResponse.json();
    const prescriptionDetails = JSON.parse(aiData.choices[0].message.content);

    // Insert prescription
    const { data: prescription, error } = await supabaseClient
      .from('prescriptions')
      .insert({
        patient_id: tempEmail.patient_id,
        medication_name: prescriptionDetails.medication_name,
        dosage: prescriptionDetails.dosage,
        frequency: prescriptionDetails.frequency,
        duration: prescriptionDetails.duration,
        prescribed_by: prescriptionDetails.prescriber,
        status: 'active',
        notes: `Received via external platform on ${file_name}`,
        received_via_temp_email: true
      })
      .select()
      .single();

    if (error) throw error;

    // Update temp email
    await supabaseClient
      .from('temp_prescription_emails')
      .update({ 
        last_received_at: new Date().toISOString(),
        status: 'used'
      })
      .eq('temp_email', temp_email);

    // Notify patient, doctor, clinic
    await supabaseClient.from('notifications').insert([
      {
        user_id: tempEmail.patient_id,
        type: 'prescription_received',
        title: 'New Prescription Received',
        message: `Your prescription for ${prescriptionDetails.medication_name} has been received and added to your records.`,
        metadata: { prescription_id: prescription.id }
      }
    ]);

    return new Response(
      JSON.stringify({ success: true, prescription_id: prescription.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});