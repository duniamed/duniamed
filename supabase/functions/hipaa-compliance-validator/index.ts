// UNLIMITED EDGE FUNCTION CAPACITIES: HIPAA Compliance Validator
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
    const { organizationId, auditScope } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Running HIPAA compliance audit for organization ${organizationId}`);

    const { data: auditLogs } = await supabase
      .from('security_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'Validate HIPAA compliance from audit logs. Return JSON: { "compliance_score": 0-100, "violations": [{"severity": "low|medium|high|critical", "description": "", "recommendation": ""}], "compliant_areas": [], "action_items": [], "certification_ready": boolean }' },
          { role: 'user', content: JSON.stringify({ auditLogs, auditScope }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const complianceReport = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, complianceReport }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('HIPAA compliance validation error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
