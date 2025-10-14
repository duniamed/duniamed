// UNLIMITED EDGE FUNCTION CAPACITIES: White-Label Configuration
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
    const { organization_id, branding_config } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Configuring white-label for organization: ${organization_id}`);

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
            content: `Validate and enhance white-label configuration. Return JSON with:
- validated_config: Validated branding settings
- theme_variables: CSS custom properties
- suggested_improvements: UX/accessibility suggestions
- compliance_checks: Brand guideline compliance`
          },
          {
            role: 'user',
            content: JSON.stringify(branding_config)
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const config_data = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('white_label_configs').upsert({
      organization_id,
      branding_config: config_data.validated_config,
      theme_variables: config_data.theme_variables,
      updated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, config_data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('White-label config error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
