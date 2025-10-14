// UNLIMITED EDGE FUNCTION CAPACITIES: CareCredit Payment Plans
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

    console.log(`Creating CareCredit plan: $${amount}`);

    // Simulate CareCredit promotional financing options
    const promotionalPlans = [
      { months: 6, apr: 0, description: '6 months no interest' },
      { months: 12, apr: 0, description: '12 months no interest' },
      { months: 18, apr: 0, description: '18 months no interest' },
      { months: 24, apr: 14.9, description: '24 months fixed APR' }
    ];

    const plans = promotionalPlans.map(plan => {
      const monthlyPayment = plan.apr === 0 
        ? (amount / plan.months)
        : (amount * (plan.apr/100/12) * Math.pow(1 + plan.apr/100/12, plan.months)) / 
          (Math.pow(1 + plan.apr/100/12, plan.months) - 1);

      return {
        ...plan,
        monthly_payment: monthlyPayment.toFixed(2),
        total_cost: (monthlyPayment * plan.months).toFixed(2),
        min_amount_required: plan.months === 6 ? 200 : plan.months === 12 ? 1000 : 2500
      };
    }).filter(plan => amount >= plan.min_amount_required);

    const result = {
      application_url: `https://carecredit.com/apply?amount=${amount}`,
      plans,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    return new Response(JSON.stringify({ success: true, carecredit: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('CareCredit plan error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
