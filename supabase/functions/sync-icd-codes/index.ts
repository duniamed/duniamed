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
    const { searchTerm, codeSystem = 'ICD-10' } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Search WHO ICD-API
    const icdResponse = await fetch(
      `https://id.who.int/icd/release/11/2024-01/mms/search?q=${encodeURIComponent(searchTerm)}&useFlexisearch=true`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en',
          'API-Version': 'v2'
        }
      }
    );

    if (!icdResponse.ok) {
      throw new Error('ICD API request failed');
    }

    const icdData = await icdResponse.json();
    const codes = [];

    for (const destination of icdData.destinationEntities || []) {
      const codeData = {
        code_system: 'ICD-11',
        code: destination.theCode || '',
        display_name: destination.title || '',
        description: destination.definition || '',
        category: destination.chapter || '',
        metadata: {
          uri: destination.id,
          matchScore: destination.score
        }
      };

      // Upsert to database
      const { error } = await supabase
        .from('medical_codes')
        .upsert(codeData, {
          onConflict: 'code_system,code',
          ignoreDuplicates: false
        });

      if (!error) {
        codes.push(codeData);
      }
    }

    return new Response(
      JSON.stringify({ codes, total: codes.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('ICD sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
