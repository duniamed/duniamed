// UNLIMITED EDGE FUNCTION CAPACITIES: Pharmacy Inventory Optimization
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
    const { clinicId, forecastDays } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Optimizing pharmacy inventory for clinic ${clinicId}`);

    const { data: inventory } = await supabase
      .from('clinic_inventory')
      .select('*')
      .eq('clinic_id', clinicId);

    const { data: prescriptionHistory } = await supabase
      .from('prescriptions')
      .select('medications, created_at')
      .eq('clinic_id', clinicId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'Optimize pharmacy inventory. Return JSON: { "reorder_items": [{"medication": "", "current_stock": number, "recommended_order": number, "urgency": "low|medium|high"}], "overstocked_items": [], "expiring_soon": [], "cost_savings_potential": number }' },
          { role: 'user', content: JSON.stringify({ inventory, prescriptionHistory, forecastDays }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const optimization = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, optimization }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Inventory optimization error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
