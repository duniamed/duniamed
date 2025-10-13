// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { 
      patient_id, 
      requester_id, 
      requester_type, 
      requested_records,
      reason 
    } = await req.json();

    // Create share request
    const { data: request, error } = await supabaseClient
      .from('health_record_share_requests')
      .insert({
        patient_id,
        requester_id,
        requester_type,
        requested_records,
        reason,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Get requester details
    const { data: requester } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', requester_id)
      .single();

    // Send notification to patient
    await supabaseClient.from('notifications').insert({
      user_id: patient_id,
      type: 'health_record_request',
      title: 'Health Record Request',
      message: `${requester?.first_name} ${requester?.last_name} has requested access to your health records: ${requested_records.join(', ')}. ${reason ? `Reason: ${reason}` : ''}`,
      metadata: { 
        request_id: request.id,
        requester_id,
        requested_records
      }
    });

    return new Response(
      JSON.stringify({ success: true, request_id: request.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});