// UNLIMITED EDGE FUNCTION CAPACITIES: Physical Clinic Staff Management
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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, clinicId, staffData } = await req.json();

    console.log(`Clinic staff management: ${action} for clinic ${clinicId}`);

    // Verify user is clinic admin
    const { data: clinic } = await supabase
      .from('clinics')
      .select('created_by')
      .eq('id', clinicId)
      .single();

    if (!clinic || clinic.created_by !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized - not clinic admin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'add_staff') {
      // Add staff member to clinic
      const { data: staff, error } = await supabase
        .from('clinic_staff')
        .insert({
          clinic_id: clinicId,
          user_id: staffData.user_id,
          role: staffData.role, // 'doctor', 'nurse', 'receptionist', 'admin'
          permissions: staffData.permissions || {},
          employment_type: staffData.employment_type, // 'full_time', 'part_time', 'contractor'
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activities').insert({
        user_id: user.id,
        action: 'staff_added',
        target_type: 'clinic_staff',
        target_id: staff.id,
        metadata: { clinic_id: clinicId, staff_role: staffData.role }
      });

      return new Response(JSON.stringify({
        success: true,
        staff
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'update_staff') {
      // Update staff member
      const { data: staff, error } = await supabase
        .from('clinic_staff')
        .update({
          role: staffData.role,
          permissions: staffData.permissions,
          is_active: staffData.is_active
        })
        .eq('id', staffData.staff_id)
        .eq('clinic_id', clinicId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        staff
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'remove_staff') {
      // Deactivate staff member (soft delete)
      const { error } = await supabase
        .from('clinic_staff')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', staffData.staff_id)
        .eq('clinic_id', clinicId);

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Staff member removed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'list_staff') {
      // Get all staff for clinic
      const { data: staff, error } = await supabase
        .from('clinic_staff')
        .select('*, profiles(*)')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        staff
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Clinic staff management error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
