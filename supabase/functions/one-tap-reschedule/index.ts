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

    const { appointmentId, newSlot, token } = await req.json();

    console.log(`Rescheduling appointment ${appointmentId} to ${newSlot}`);

    // Verify token if provided (for one-tap from SMS/email)
    if (token) {
      // In production, validate JWT token
      // For now, proceed with appointmentId validation
    }

    // Get appointment details
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('*, specialists(*), profiles!patient_id(*)')
      .eq('id', appointmentId)
      .single();

    if (aptError || !appointment) {
      throw new Error('Appointment not found');
    }

    // Check if new slot is available
    const { data: slotsData } = await supabase.functions.invoke('find-available-slots', {
      body: {
        specialistId: appointment.specialist_id,
        startDate: newSlot,
        endDate: new Date(new Date(newSlot).getTime() + 24 * 60 * 60 * 1000).toISOString()
      }
    });

    const slotAvailable = slotsData?.slots?.includes(newSlot);
    
    if (!slotAvailable) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slot no longer available'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update appointment
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        scheduled_at: newSlot,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    // Send confirmation notifications
    await Promise.all([
      // Notify patient
      supabase.functions.invoke('send-multi-channel-notification', {
        body: {
          userId: appointment.patient_id,
          type: 'appointment_rescheduled',
          title: 'Appointment Rescheduled',
          message: `Your appointment has been rescheduled to ${new Date(newSlot).toLocaleString()}`,
          channels: ['email', 'sms', 'whatsapp']
        }
      }),
      // Notify specialist
      supabase.functions.invoke('send-notification', {
        body: {
          userId: appointment.specialists.user_id,
          type: 'appointment_rescheduled',
          title: 'Appointment Rescheduled',
          message: `Patient ${appointment.profiles.first_name} rescheduled for ${new Date(newSlot).toLocaleString()}`
        }
      })
    ]);

    return new Response(JSON.stringify({
      success: true,
      appointment: {
        id: appointmentId,
        newScheduledAt: newSlot
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('One-tap reschedule error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});