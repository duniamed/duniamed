import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// FHIR R4 Resource Mapping
const mapPatientToProfile = (fhirPatient: any) => ({
  first_name: fhirPatient.name?.[0]?.given?.join(' '),
  last_name: fhirPatient.name?.[0]?.family,
  date_of_birth: fhirPatient.birthDate,
  gender: fhirPatient.gender,
  phone: fhirPatient.telecom?.find((t: any) => t.system === 'phone')?.value,
  email: fhirPatient.telecom?.find((t: any) => t.system === 'email')?.value,
  address_line1: fhirPatient.address?.[0]?.line?.join(', '),
  city: fhirPatient.address?.[0]?.city,
  state: fhirPatient.address?.[0]?.state,
  postal_code: fhirPatient.address?.[0]?.postalCode,
  country: fhirPatient.address?.[0]?.country,
});

const mapEncounterToAppointment = (fhirEncounter: any) => ({
  scheduled_at: fhirEncounter.period?.start,
  completed_at: fhirEncounter.period?.end,
  status: fhirEncounter.status === 'finished' ? 'completed' : 'pending',
  consultation_type: fhirEncounter.class?.display || 'in-person',
  notes: fhirEncounter.reasonCode?.map((r: any) => r.text).join('; '),
  external_id: fhirEncounter.id,
});

const mapMedicationRequestToPrescription = (fhirMedRequest: any) => ({
  medication_name: fhirMedRequest.medicationCodeableConcept?.coding?.[0]?.display || 
                   fhirMedRequest.medicationCodeableConcept?.text,
  dosage: fhirMedRequest.dosageInstruction?.[0]?.text,
  frequency: fhirMedRequest.dosageInstruction?.[0]?.timing?.code?.text,
  start_date: fhirMedRequest.authoredOn,
  status: fhirMedRequest.status === 'active' ? 'active' : 'completed',
  instructions: fhirMedRequest.dosageInstruction?.[0]?.patientInstruction,
  external_id: fhirMedRequest.id,
});

const mapObservationToVital = (fhirObservation: any) => {
  const code = fhirObservation.code?.coding?.[0]?.code;
  const value = fhirObservation.valueQuantity?.value;
  const unit = fhirObservation.valueQuantity?.unit;

  // Map LOINC codes to vitals
  const vitalMapping: Record<string, string> = {
    '8867-4': 'heart_rate',
    '8480-6': 'blood_pressure_systolic',
    '8462-4': 'blood_pressure_diastolic',
    '8310-5': 'temperature',
    '2708-6': 'oxygen_saturation',
    '9279-1': 'respiratory_rate',
  };

  return {
    vital_type: vitalMapping[code] || code,
    value,
    unit,
    recorded_at: fhirObservation.effectiveDateTime,
    external_id: fhirObservation.id,
  };
};

const mapConditionToProblem = (fhirCondition: any) => ({
  condition_name: fhirCondition.code?.coding?.[0]?.display || fhirCondition.code?.text,
  icd_code: fhirCondition.code?.coding?.find((c: any) => c.system?.includes('icd'))?.code,
  status: fhirCondition.clinicalStatus?.coding?.[0]?.code,
  onset_date: fhirCondition.onsetDateTime,
  notes: fhirCondition.note?.map((n: any) => n.text).join('; '),
  external_id: fhirCondition.id,
});

const mapAllergyIntolerance = (fhirAllergy: any) => ({
  allergen: fhirAllergy.code?.coding?.[0]?.display || fhirAllergy.code?.text,
  severity: fhirAllergy.criticality,
  reaction: fhirAllergy.reaction?.map((r: any) => 
    r.manifestation?.map((m: any) => m.text).join(', ')
  ).join('; '),
  status: fhirAllergy.clinicalStatus?.coding?.[0]?.code,
  recorded_date: fhirAllergy.recordedDate,
  external_id: fhirAllergy.id,
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resourceType, fhirResource } = await req.json();

    let mapped: any = null;

    switch (resourceType) {
      case 'Patient':
        mapped = mapPatientToProfile(fhirResource);
        break;
      case 'Encounter':
        mapped = mapEncounterToAppointment(fhirResource);
        break;
      case 'MedicationRequest':
        mapped = mapMedicationRequestToPrescription(fhirResource);
        break;
      case 'Observation':
        mapped = mapObservationToVital(fhirResource);
        break;
      case 'Condition':
        mapped = mapConditionToProblem(fhirResource);
        break;
      case 'AllergyIntolerance':
        mapped = mapAllergyIntolerance(fhirResource);
        break;
      default:
        throw new Error(`Unsupported FHIR resource type: ${resourceType}`);
    }

    return new Response(JSON.stringify({
      success: true,
      resourceType,
      mapped,
      original: fhirResource,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('FHIR mapping error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
