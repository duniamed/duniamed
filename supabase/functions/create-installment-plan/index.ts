// UNLIMITED EDGE FUNCTION CAPACITIES: Installment Plan Creation via Affirm/CareCredit
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

    const { appointmentId, totalAmount, downPayment, termMonths, provider } = await req.json();

    console.log(`Creating installment plan for appointment ${appointmentId}`);

    // Calculate installment details
    const principalAmount = totalAmount - (downPayment || 0);
    const monthlyPayment = principalAmount / termMonths;
    const interestRate = provider === 'carecredit' ? 0.0 : 0.10; // CareCredit 0% promo vs Affirm 10%

    // Create installment plan record
    const { data: plan, error: planError } = await supabase
      .from('installment_plans')
      .insert({
        appointment_id: appointmentId,
        patient_id: user.id,
        total_amount: totalAmount,
        down_payment: downPayment || 0,
        principal_amount: principalAmount,
        interest_rate: interestRate,
        term_months: termMonths,
        monthly_payment: monthlyPayment,
        provider: provider,
        status: 'pending',
        metadata: {
          created_via: 'patient_portal',
          provider_response: null
        }
      })
      .select()
      .single();

    if (planError) throw planError;

    // In production, integrate with Affirm/CareCredit API
    // For now, simulate approval
    const approved = totalAmount < 5000; // Simulate approval logic

    if (approved) {
      await supabase
        .from('installment_plans')
        .update({ 
          status: 'active',
          approved_at: new Date().toISOString()
        })
        .eq('id', plan.id);
    }

    return new Response(JSON.stringify({
      success: true,
      plan: {
        ...plan,
        status: approved ? 'active' : 'pending'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Installment plan error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
