// UNLIMITED EDGE FUNCTION CAPACITIES: Physical Clinic Resource Allocation
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

    const { appointmentId, clinicId, resourceType } = await req.json();

    console.log(`Allocating ${resourceType} resource for appointment ${appointmentId}`);

    // Get appointment details
    const { data: appointment } = await supabase
      .from('appointments')
      .select('scheduled_at, duration_minutes')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const startTime = new Date(appointment.scheduled_at);
    const endTime = new Date(startTime.getTime() + (appointment.duration_minutes || 30) * 60000);

    // Find available resource
    const { data: resources } = await supabase
      .from('clinic_resources')
      .select('id, name, resource_type')
      .eq('clinic_id', clinicId)
      .eq('resource_type', resourceType)
      .eq('is_active', true);

    let allocatedResource = null;

    for (const resource of resources || []) {
      // Check if resource is available during appointment time
      const { data: conflicts } = await supabase
        .from('resource_allocations')
        .select('id')
        .eq('resource_id', resource.id)
        .gte('allocated_at', startTime.toISOString())
        .lte('allocated_at', endTime.toISOString())
        .is('released_at', null);

      if (!conflicts || conflicts.length === 0) {
        // Resource is available
        const { data: allocation, error } = await supabase
          .from('resource_allocations')
          .insert({
            appointment_id: appointmentId,
            resource_id: resource.id,
            allocated_at: startTime.toISOString(),
            duration_minutes: appointment.duration_minutes || 30
          })
          .select()
          .single();

        if (!error) {
          allocatedResource = {
            ...resource,
            allocation_id: allocation.id
          };
          break;
        }
      }
    }

    if (!allocatedResource) {
      return new Response(JSON.stringify({
        success: false,
        error: `No available ${resourceType} resources`
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update appointment with resource info
    await supabase
      .from('appointments')
      .update({
        location_id: allocatedResource.id
      })
      .eq('id', appointmentId);

    return new Response(JSON.stringify({
      success: true,
      allocated_resource: allocatedResource
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Resource allocation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
