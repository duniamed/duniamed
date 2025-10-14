// UNLIMITED EDGE FUNCTION CAPACITIES: Affirm Installment Plans
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, patient_info } = await req.json();

    console.log(`Creating Affirm installment plan: $${amount}`);

    // Real implementation would integrate with Affirm API
    // Simulate installment plan calculation
    const monthlyPlans = [3, 6, 12, 24];
    const apr = 0.15; // 15% APR

    const plans = monthlyPlans.map(months => {
      const monthlyRate = apr / 12;
      const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                            (Math.pow(1 + monthlyRate, months) - 1);
      const totalCost = monthlyPayment * months;
      const totalInterest = totalCost - amount;

      return {
        months,
        monthly_payment: monthlyPayment.toFixed(2),
        total_cost: totalCost.toFixed(2),
        total_interest: totalInterest.toFixed(2),
        apr: (apr * 100).toFixed(2) + '%'
      };
    });

    const result = {
      checkout_url: `https://sandbox.affirm.com/checkout/${Date.now()}`,
      plans,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min
    };

    return new Response(JSON.stringify({ success: true, affirm: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Affirm installment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
