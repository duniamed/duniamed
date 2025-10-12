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
    const verification_status = url.searchParams.get('verification_status') || '';
    const specialty = url.searchParams.get('specialty') || '';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('specialists')
      .select(`
        *,
        profiles!inner(first_name, last_name, email, avatar_url),
        credentials(*),
        reviews(rating)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`profiles.first_name.ilike.%${search}%,profiles.last_name.ilike.%${search}%,license_number.ilike.%${search}%`);
    }

    if (verification_status) {
      query = query.eq('verification_status', verification_status);
    }

    if (specialty) {
      query = query.contains('specialty', [specialty]);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: specialists, error: queryError, count } = await query;

    if (queryError) throw queryError;

    // Calculate average ratings
    const enrichedSpecialists = specialists?.map(specialist => ({
      ...specialist,
      average_rating: specialist.reviews.length > 0
        ? specialist.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / specialist.reviews.length
        : null,
      total_reviews: specialist.reviews.length,
    }));

    // Log admin action
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'list_specialists',
      target_type: 'specialists',
      changes: { page, limit, search, verification_status, specialty },
      ip_address: req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent'),
    });

    return new Response(
      JSON.stringify({
        specialists: enrichedSpecialists,
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
    console.error('Error listing specialists:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes('Forbidden') ? 403 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});