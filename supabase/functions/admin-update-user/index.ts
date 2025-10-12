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

    const { user_id, updates } = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

    // Get current user data
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log admin action
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'update_user',
      target_type: 'user',
      target_id: user_id,
      changes: {
        before: currentUser,
        after: updates,
      },
      ip_address: req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent'),
    });

    return new Response(
      JSON.stringify({ user: updatedProfile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes('Forbidden') ? 403 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});