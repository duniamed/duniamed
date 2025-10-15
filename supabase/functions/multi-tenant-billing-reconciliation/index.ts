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

    const { clinicIds, startDate, endDate } = await req.json();

    // Fetch billing data across multiple clinics
    const { data: billingRecords } = await supabase
      .from('billing_transactions')
      .select('*, clinics(*), appointments(*)')
      .in('clinic_id', clinicIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // ML-powered reconciliation analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Perform multi-tenant billing reconciliation. Return JSON:
{
  "reconciliation_summary": {
    "total_revenue": number,
    "total_outstanding": number,
    "discrepancies_found": number,
    "reconciliation_rate": 0-100
  },
  "clinic_breakdowns": [
    {
      "clinic_id": "uuid",
      "clinic_name": "string",
      "revenue": number,
      "outstanding": number,
      "paid": number,
      "pending": number,
      "discrepancies": ["string"]
    }
  ],
  "payment_channel_analysis": {
    "insurance": number,
    "self_pay": number,
    "copay": number
  },
  "anomalies_detected": [
    {
      "type": "string",
      "clinic_id": "uuid",
      "amount": number,
      "description": "string",
      "severity": "low|medium|high"
    }
  ],
  "recommendations": ["string"]
}`
          },
          {
            role: 'user',
            content: JSON.stringify({
              billingRecords,
              dateRange: { startDate, endDate }
            })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const reconciliation = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({
      success: true,
      reconciliation,
      processed_records: billingRecords?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Multi-tenant billing reconciliation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
