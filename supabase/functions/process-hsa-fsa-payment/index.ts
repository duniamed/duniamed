// UNLIMITED EDGE FUNCTION CAPACITIES: HSA/FSA Payment Processing
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
    const { payment_data, account_type } = await req.json();

    console.log(`Processing ${account_type} payment: ${payment_data.amount}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate HSA/FSA eligibility
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
            content: `Validate if expense is HSA/FSA eligible. Return JSON with:
- eligible: boolean
- reason: Explanation
- compliance_notes: IRS compliance notes
- documentation_required: Required documentation`
          },
          {
            role: 'user',
            content: `Account: ${account_type}, Service: ${payment_data.service_description}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const eligibility = JSON.parse(aiData.choices[0].message.content);

    if (!eligibility.eligible) {
      return new Response(JSON.stringify({ 
        error: `Not eligible for ${account_type}: ${eligibility.reason}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process payment (would integrate with HSA/FSA payment gateway)
    const paymentResult = {
      payment_id: `hsa_${Date.now()}`,
      status: 'processed',
      account_type,
      amount: payment_data.amount,
      eligibility_verified: true,
      processed_at: new Date().toISOString()
    };

    return new Response(JSON.stringify({ success: true, payment: paymentResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('HSA/FSA payment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
