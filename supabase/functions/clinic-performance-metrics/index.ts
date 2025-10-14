// UNLIMITED EDGE FUNCTION CAPACITIES: Clinic Performance Metrics
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
    const { clinic_id, date_range } = await req.json();

    console.log(`Calculating performance metrics for clinic: ${clinic_id}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch clinic data
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinic_id)
      .gte('scheduled_at', date_range.start)
      .lte('scheduled_at', date_range.end);

    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('clinic_id', clinic_id);

    const metrics = {
      appointment_count: appointments?.length || 0,
      avg_rating: reviews?.reduce((acc, r) => acc + r.rating, 0) / (reviews?.length || 1),
      completion_rate: appointments?.filter(a => a.status === 'completed').length / (appointments?.length || 1),
      cancellation_rate: appointments?.filter(a => a.status === 'cancelled').length / (appointments?.length || 1),
      no_show_rate: appointments?.filter(a => a.status === 'no_show').length / (appointments?.length || 1)
    };

    return new Response(JSON.stringify({ success: true, metrics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Clinic performance metrics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
