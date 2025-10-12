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

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status') || '';

    // Validate and sanitize search input
    if (search && search.length > 100) {
      throw new Error('Search query too long');
    }
    if (search && !/^[a-zA-Z0-9\s@.\-_]*$/.test(search)) {
      throw new Error('Invalid characters in search query');
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select(`
        *,
        user_roles(role)
      `, { count: 'exact' });

    if (search) {
      // Escape wildcards to prevent SQL injection
      const sanitized = search.replace(/[%_]/g, '\\$&');
      query = query.or(`first_name.ilike.%${sanitized}%,last_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error: queryError, count } = await query;

    if (queryError) throw queryError;

    // Log admin action
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'list_users',
      target_type: 'users',
      changes: { page, limit, search, role },
      ip_address: req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent'),
    });

    return new Response(
      JSON.stringify({
        users,
        pagination: {
          page,
          limit,
          total: count,
          total_pages: Math.ceil((count || 0) / limit),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error listing users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes('Forbidden') ? 403 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});