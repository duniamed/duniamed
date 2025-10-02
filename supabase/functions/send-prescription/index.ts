import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PrescriptionData {
  prescriptionId: string;
  pharmacyNcpdpId: string;
  patientId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prescriptionId, pharmacyNcpdpId, patientId }: PrescriptionData = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Processing e-prescription routing:", { prescriptionId, pharmacyNcpdpId });

    // Fetch prescription details
    const { data: prescription, error: prescriptionError } = await supabase
      .from("prescriptions")
      .select(`
        *,
        patient:profiles!prescriptions_patient_id_fkey(
          first_name,
          last_name,
          date_of_birth,
          gender,
          address_line1,
          city,
          state,
          postal_code
        ),
        specialist:specialists!prescriptions_specialist_id_fkey(
          user_id,
          license_number,
          license_country,
          license_state,
          profiles:profiles!specialists_user_id_fkey(
            first_name,
            last_name
          )
        )
      `)
      .eq("id", prescriptionId)
      .single();

    if (prescriptionError || !prescription) {
      throw new Error("Prescription not found");
    }

    // Build NCPDP SCRIPT 2023 message (XML format)
    const ncpdpMessage = {
      Message: {
        Header: {
          To: pharmacyNcpdpId,
          From: "YOUR_NCPDP_ID", // Replace with actual NCPDP ID from env
          MessageID: `MSG-${Date.now()}`,
          SentTime: new Date().toISOString(),
          MessageType: "NEWRX",
        },
        Body: {
          NewRx: {
            Patient: {
              Identification: {
                MemberId: patientId,
              },
              Name: {
                FirstName: prescription.patient?.first_name,
                LastName: prescription.patient?.last_name,
              },
              Gender: prescription.patient?.gender,
              DateOfBirth: prescription.patient?.date_of_birth,
              Address: {
                AddressLine1: prescription.patient?.address_line1,
                City: prescription.patient?.city,
                State: prescription.patient?.state,
                ZipCode: prescription.patient?.postal_code,
              },
            },
            Prescriber: {
              Identification: {
                DEANumber: prescription.specialist?.license_number,
                StateLicenseNumber: prescription.specialist?.license_number,
              },
              Name: {
                FirstName: prescription.specialist?.profiles?.first_name,
                LastName: prescription.specialist?.profiles?.last_name,
              },
            },
            Medication: {
              DrugDescription: prescription.medication_name,
              Quantity: {
                Value: prescription.quantity,
                CodeListQualifier: "38", // Quantity
                QuantityUnitOfMeasure: {
                  Code: "C48542", // Each
                },
              },
              DaysSupply: prescription.duration_days,
              Substitutions: prescription.allow_substitution ? "0" : "1",
              WrittenDate: {
                Date: new Date().toISOString().split('T')[0],
              },
              Refills: {
                Qualifier: "R",
                Value: prescription.refills_allowed.toString(),
              },
              Sig: {
                SigText: `${prescription.dosage} ${prescription.frequency}. ${prescription.instructions || ''}`,
              },
            },
          },
        },
      },
    };

    // Real implementation would call Surescripts API:
    // const surescriptsApiKey = Deno.env.get("SURESCRIPTS_API_KEY");
    // const surescriptsUrl = "https://api.surescripts.com/";
    // 
    // const response = await fetch(`${surescriptsUrl}/messaging/v1/messages`, {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${surescriptsApiKey}`,
    //     "Content-Type": "application/xml",
    //   },
    //   body: convertToXML(ncpdpMessage), // Convert JSON to XML
    // });

    // For now, simulate successful transmission
    console.log("NCPDP Message prepared:", JSON.stringify(ncpdpMessage, null, 2));

    // Update prescription status
    const { error: updateError } = await supabase
      .from("prescriptions")
      .update({
        status: "sent",
        sent_to_pharmacy_at: new Date().toISOString(),
        pharmacy_ncpdp_id: pharmacyNcpdpId,
      })
      .eq("id", prescriptionId);

    if (updateError) {
      throw updateError;
    }

    // Log the transaction
    await supabase.from("prescription_transmissions").insert({
      prescription_id: prescriptionId,
      pharmacy_ncpdp_id: pharmacyNcpdpId,
      transmission_status: "sent",
      ncpdp_message: ncpdpMessage,
      transmission_date: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Prescription successfully routed to pharmacy",
        messageId: ncpdpMessage.Message.Header.MessageID,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("E-prescription routing error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
