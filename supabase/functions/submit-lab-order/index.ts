import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LabOrderData {
  orderId: string;
  patientId: string;
  specialistId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, patientId, specialistId }: LabOrderData = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Processing lab order submission:", { orderId });

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("lab_orders")
      .select(`
        *,
        patient:profiles!lab_orders_patient_id_fkey(
          first_name,
          last_name,
          date_of_birth,
          gender
        ),
        specialist:specialists!lab_orders_specialist_id_fkey(
          license_number,
          profiles:profiles!specialists_user_id_fkey(
            first_name,
            last_name
          )
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Lab order not found");
    }

    // Build FHIR R4 ServiceRequest for lab order
    const fhirServiceRequest = {
      resourceType: "ServiceRequest",
      id: orderId,
      status: "active",
      intent: "order",
      priority: order.priority || "routine",
      category: [
        {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: order.order_type === "laboratory" ? "108252007" : "363679005",
              display: order.order_type === "laboratory" ? "Laboratory procedure" : "Imaging",
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: order.test_codes?.[0] || "Unknown",
            display: order.test_names?.[0] || "Lab Test",
          },
        ],
        text: order.test_names?.join(", "),
      },
      subject: {
        reference: `Patient/${patientId}`,
        display: `${order.patient?.first_name} ${order.patient?.last_name}`,
      },
      encounter: order.appointment_id
        ? { reference: `Encounter/${order.appointment_id}` }
        : undefined,
      authoredOn: new Date().toISOString(),
      requester: {
        reference: `Practitioner/${specialistId}`,
        display: `${order.specialist?.profiles?.first_name} ${order.specialist?.profiles?.last_name}`,
      },
      reasonCode: [
        {
          text: order.clinical_notes || "Clinical indication",
        },
      ],
      note: order.clinical_notes
        ? [
            {
              text: order.clinical_notes,
            },
          ]
        : undefined,
    };

    // Real implementation would call LIS/RIS FHIR endpoint:
    // const lisApiKey = Deno.env.get("LIS_API_KEY");
    // const lisEndpoint = Deno.env.get("LIS_FHIR_ENDPOINT"); // e.g., Cerner/Epic endpoint
    // 
    // const response = await fetch(`${lisEndpoint}/ServiceRequest`, {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${lisApiKey}`,
    //     "Content-Type": "application/fhir+json",
    //     "Accept": "application/fhir+json",
    //   },
    //   body: JSON.stringify(fhirServiceRequest),
    // });
    //
    // const fhirResponse = await response.json();

    console.log("FHIR ServiceRequest prepared:", JSON.stringify(fhirServiceRequest, null, 2));

    // Simulate successful submission
    const accessionNumber = `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Update order status
    const { error: updateError } = await supabase
      .from("lab_orders")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        accession_number: accessionNumber,
        external_order_id: fhirServiceRequest.id,
      })
      .eq("id", orderId);

    if (updateError) {
      throw updateError;
    }

    // Log transmission
    await supabase.from("lab_order_transmissions").insert({
      lab_order_id: orderId,
      transmission_status: "sent",
      fhir_request: fhirServiceRequest,
      accession_number: accessionNumber,
      transmitted_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Lab order successfully submitted",
        accessionNumber,
        orderId: fhirServiceRequest.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Lab order submission error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
