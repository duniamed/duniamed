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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { specialist_id, available_slot, slot_details } = await req.json();

    // Get waitlist entries for this specialist
    const { data: waitlistEntries, error: waitlistError } = await supabaseClient
      .from('appointment_waitlist')
      .select('*, profiles!inner(email, phone, first_name)')
      .eq('specialist_id', specialist_id)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(5);

    if (waitlistError) throw waitlistError;

    if (!waitlistEntries || waitlistEntries.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No waitlist entries found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Notify first person on waitlist
    const firstEntry = waitlistEntries[0];
    
    // Send email via send-multi-channel-notification
    await supabaseClient.functions.invoke('send-multi-channel-notification', {
      body: {
        user_id: firstEntry.patient_id,
        subject: 'Appointment Available on Waitlist!',
        message: `Hello ${firstEntry.profiles.first_name}, an appointment slot has become available with your requested specialist on ${new Date(available_slot).toLocaleString()}. You have 15 minutes to book this slot before it's offered to the next person. Please log in to book now.`,
        notification_type: 'waitlist_slot_available',
        metadata: {
          waitlist_id: firstEntry.id,
          specialist_id,
          available_slot,
          slot_details,
          claim_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        }
      }
    });

    // Update waitlist entry
    await supabaseClient
      .from('appointment_waitlist')
      .update({ 
        notified_at: new Date().toISOString(),
        status: 'notified'
      })
      .eq('id', firstEntry.id);

    return new Response(
      JSON.stringify({ success: true, notified_patient: firstEntry.patient_id }),
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