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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { patient_id, specialist_id, urgency_score, symptoms, notes } = await req.json();

    // Check if urgency score is high enough
    if (urgency_score < 0.7) {
      return new Response(
        JSON.stringify({ message: 'Urgency score too low for auto-insert' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check if already on waitlist
    const { data: existing } = await supabaseClient
      .from('appointment_waitlist')
      .select('id')
      .eq('patient_id', patient_id)
      .eq('specialist_id', specialist_id)
      .eq('status', 'waiting')
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ message: 'Already on waitlist' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Insert into waitlist
    const { data: waitlistEntry, error } = await supabaseClient
      .from('appointment_waitlist')
      .insert({
        patient_id,
        specialist_id,
        status: 'waiting',
        notes: notes || `Auto-inserted from symptom checker - High urgency (${urgency_score})\nSymptoms: ${symptoms || 'N/A'}`,
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification
    await supabaseClient.from('notifications').insert({
      user_id: patient_id,
      type: 'waitlist_added',
      title: 'Added to Waitlist',
      message: 'You have been automatically added to the waitlist due to high urgency symptoms. We will notify you when an appointment becomes available.',
      metadata: { waitlist_id: waitlistEntry.id, urgency_score }
    });

    return new Response(
      JSON.stringify({ success: true, waitlist_entry: waitlistEntry }),
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