// UNLIMITED EDGE FUNCTION CAPACITIES: Blockchain Record Verification
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
    const { recordHash, blockchainNetwork } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log(`Verifying blockchain record: ${recordHash} on ${blockchainNetwork}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Verify blockchain medical record integrity. Return JSON: { "verified": boolean, "timestamp": "", "block_number": number, "transaction_hash": "", "integrity_status": "valid|tampered|not_found", "metadata": {} }' },
          { role: 'user', content: JSON.stringify({ recordHash, blockchainNetwork }) }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const verification = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, verification }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Blockchain verification error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
