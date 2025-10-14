// UNLIMITED EDGE FUNCTION CAPACITIES: FHIR Bundle Export for Interoperability
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

    const { patientId, resourceTypes } = await req.json();

    console.log(`Exporting FHIR bundle for patient ${patientId}`);

    // Verify user has access to patient data
    if (user.id !== patientId) {
      // Check if user is a specialist with access
      const { data: appointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', patientId)
        .eq('specialist_id', user.id)
        .limit(1)
        .single();

      if (!appointment) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const entries: any[] = [];

    // Get patient profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single();

    if (profile) {
      entries.push({
        fullUrl: `urn:uuid:${patientId}`,
        resource: {
          resourceType: 'Patient',
          id: patientId,
          name: [{
            given: [profile.first_name],
            family: profile.last_name
          }],
          telecom: [{
            system: 'email',
            value: profile.email
          }],
          birthDate: profile.date_of_birth,
          gender: profile.gender
        }
      });
    }

    // Get appointments (encounters)
    if (!resourceTypes || resourceTypes.includes('Encounter')) {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, specialists(*), soap_notes(*)')
        .eq('patient_id', patientId);

      appointments?.forEach(apt => {
        entries.push({
          fullUrl: `urn:uuid:${apt.id}`,
          resource: {
            resourceType: 'Encounter',
            id: apt.id,
            status: apt.status === 'completed' ? 'finished' : 'planned',
            class: {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: apt.consultation_type === 'video' ? 'VR' : 'AMB'
            },
            subject: { reference: `Patient/${patientId}` },
            participant: [{
              individual: { reference: `Practitioner/${apt.specialist_id}` }
            }],
            period: {
              start: apt.scheduled_at,
              end: apt.completed_at
            }
          }
        });

        // Add clinical notes
        if (apt.soap_notes && apt.soap_notes.length > 0) {
          apt.soap_notes.forEach((note: any) => {
            entries.push({
              fullUrl: `urn:uuid:${note.id}`,
              resource: {
                resourceType: 'DocumentReference',
                id: note.id,
                status: 'current',
                type: {
                  coding: [{
                    system: 'http://loinc.org',
                    code: '11506-3',
                    display: 'Progress note'
                  }]
                },
                subject: { reference: `Patient/${patientId}` },
                content: [{
                  attachment: {
                    contentType: 'text/plain',
                    data: btoa(JSON.stringify({
                      subjective: note.subjective,
                      objective: note.objective,
                      assessment: note.assessment,
                      plan: note.plan
                    }))
                  }
                }],
                context: {
                  encounter: [{ reference: `Encounter/${apt.id}` }]
                }
              }
            });
          });
        }
      });
    }

    // Get prescriptions (medication requests)
    if (!resourceTypes || resourceTypes.includes('MedicationRequest')) {
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId);

      prescriptions?.forEach(rx => {
        entries.push({
          fullUrl: `urn:uuid:${rx.id}`,
          resource: {
            resourceType: 'MedicationRequest',
            id: rx.id,
            status: rx.status,
            intent: 'order',
            medicationCodeableConcept: {
              text: rx.medication_name
            },
            subject: { reference: `Patient/${patientId}` },
            authoredOn: rx.created_at,
            dosageInstruction: [{
              text: rx.dosage_instructions
            }]
          }
        });
      });
    }

    // Create FHIR Bundle
    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: entries
    };

    // Log export
    await supabase.from('fhir_exports').insert({
      patient_id: patientId,
      exported_by: user.id,
      resource_types: resourceTypes || ['all'],
      entry_count: entries.length
    });

    return new Response(JSON.stringify(bundle), {
      headers: { ...corsHeaders, 'Content-Type': 'application/fhir+json' },
    });

  } catch (error: any) {
    console.error('FHIR export error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
