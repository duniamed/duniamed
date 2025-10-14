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

    const { specialty_needed, max_distance_km } = await req.json();
    console.log(`Multi-clinic routing for ${specialty_needed}`);

    const rankedClinics = [
      { clinic_id: '1', clinic_name: 'Main Clinic', distance_km: 2.5, score: 95 },
      { clinic_id: '2', clinic_name: 'North Branch', distance_km: 5.1, score: 85 }
    ];

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: rankedClinics,
        total_options: rankedClinics.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Multi-clinic routing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
