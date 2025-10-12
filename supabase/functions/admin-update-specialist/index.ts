import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      throw new Error('Forbidden: Admin access required');
    }

    const { specialist_id, updates } = await req.json();

    if (!specialist_id) {
      throw new Error('specialist_id is required');
    }

    // Get current specialist data
    const { data: currentSpecialist } = await supabase
      .from('specialists')
      .select('*')
      .eq('id', specialist_id)
      .single();

    // Update specialist
    const { data: updatedSpecialist, error: updateError } = await supabase
      .from('specialists')
      .update(updates)
      .eq('id', specialist_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If verification status changed, send notification
    if (updates.verification_status && updates.verification_status !== currentSpecialist?.verification_status) {
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: updatedSpecialist.user_id,
          type: 'verification_status_change',
          title: 'Verification Status Updated',
          message: `Your verification status has been updated to: ${updates.verification_status}`,
          data: {
            verification_status: updates.verification_status,
          },
        },
      });
    }

    // Log admin action
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'update_specialist',
      target_type: 'specialist',
      target_id: specialist_id,
      changes: {
        before: currentSpecialist,
        after: updates,
      },
      ip_address: req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent'),
    });

    return new Response(
      JSON.stringify({ specialist: updatedSpecialist }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating specialist:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes('Forbidden') ? 403 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});