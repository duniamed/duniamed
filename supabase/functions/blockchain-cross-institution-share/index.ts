// UNLIMITED EDGE FUNCTION CAPACITIES: Cross-Institution Blockchain Sharing
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
    const { record_hash, target_institution, patient_consent } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Sharing record ${record_hash} with ${target_institution}`);

    if (!patient_consent) {
      throw new Error('Patient consent required for cross-institution sharing');
    }

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
            content: `Generate secure sharing token and metadata for cross-institution record sharing. Return JSON with:
- share_token: Secure token for access
- expiration: Token expiration timestamp
- permissions: Access permissions granted
- audit_trail: Sharing event details`
          },
          {
            role: 'user',
            content: JSON.stringify({ record_hash, target_institution })
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    const sharing_data = JSON.parse(aiData.choices[0].message.content);

    await supabase.from('blockchain_shares').insert({
      record_hash,
      target_institution,
      share_token: sharing_data.share_token,
      expires_at: sharing_data.expiration,
      permissions: sharing_data.permissions,
      shared_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, sharing_data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Cross-institution sharing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
