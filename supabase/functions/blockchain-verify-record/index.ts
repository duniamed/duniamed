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

    const { recordId, recordType, patientId } = await req.json();

    // Fetch record data
    const { data: record } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', recordId)
      .single();

    // Simulate blockchain verification using AI
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
            content: `Verify medical record integrity using blockchain principles. Return JSON:
{
  "verified": boolean,
  "integrity_score": 0-100,
  "blockchain_hash": "string",
  "timestamp": "ISO timestamp",
  "verification_chain": [
    {
      "block_number": number,
      "hash": "string",
      "previous_hash": "string",
      "verified": boolean
    }
  ],
  "audit_trail": ["string"],
  "tamper_detected": boolean,
  "confidence": 0-1
}`
          },
          {
            role: 'user',
            content: JSON.stringify({
              record,
              recordType,
              patientId
            })
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const verification = JSON.parse(aiData.choices[0].message.content);

    // Store verification result
    await supabase
      .from('blockchain_verifications')
      .insert({
        record_id: recordId,
        record_type: recordType,
        patient_id: patientId,
        verification_result: verification,
        verified_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({
      success: true,
      verification
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Blockchain verification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
