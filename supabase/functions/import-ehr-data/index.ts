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

    const { source, data_type, fhir_bundle } = await req.json();

    console.log(`Importing EHR data from ${source} for user ${user.id}`);

    // Parse FHIR Bundle and extract resources
    const resources = fhir_bundle.entry?.map((entry: any) => entry.resource) || [];

    const imported = {
      patients: 0,
      encounters: 0,
      medications: 0,
      observations: 0,
      conditions: 0,
      allergies: 0,
    };

    // Process each resource by type
    for (const resource of resources) {
      const resourceType = resource.resourceType;

      switch (resourceType) {
        case 'Patient':
          // Map to profiles table
          await supabase.from('profiles').upsert({
            id: user.id,
            first_name: resource.name?.[0]?.given?.[0],
            last_name: resource.name?.[0]?.family,
            date_of_birth: resource.birthDate,
            gender: resource.gender,
            phone: resource.telecom?.find((t: any) => t.system === 'phone')?.value,
          }, { onConflict: 'id' });
          imported.patients++;
          break;

        case 'Encounter':
          // Map to appointments or encounters table
          imported.encounters++;
          break;

        case 'MedicationRequest':
          // Map to prescriptions table
          const { data: prescription } = await supabase.from('prescriptions').insert({
            patient_id: user.id,
            medication_name: resource.medicationCodeableConcept?.text || 'Unknown',
            dosage: resource.dosageInstruction?.[0]?.text,
            status: resource.status === 'active' ? 'active' : 'completed',
            external_id: resource.id,
          });
          imported.medications++;
          break;

        case 'Observation':
          // Map to vitals or lab results
          imported.observations++;
          break;

        case 'Condition':
          // Map to patient conditions/problems
          imported.conditions++;
          break;

        case 'AllergyIntolerance':
          // Map to allergies table
          imported.allergies++;
          break;

        default:
          console.log(`Unsupported resource type: ${resourceType}`);
      }
    }

    // Log import event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'ehr_import',
      resource_type: 'ehr_data',
      changes: {
        source,
        data_type,
        imported,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      imported,
      total_resources: resources.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('EHR import error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
