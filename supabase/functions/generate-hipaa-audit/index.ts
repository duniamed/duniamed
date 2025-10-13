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
    if (!authHeader) throw new Error('Missing authorization');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) throw new Error('Unauthorized');

    // Verify admin access
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) throw new Error('Admin access required');

    const { startDate, endDate, filterUser, filterAction } = await req.json();

    console.log(`Generating HIPAA audit report from ${startDate} to ${endDate}`);

    // Build query for security audit logs
    let query = supabase
      .from('security_audit_log')
      .select(`
        *,
        profiles!security_audit_log_user_id_fkey (
          first_name,
          last_name,
          email,
          role
        )
      `)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false });

    if (filterUser) {
      query = query.eq('user_id', filterUser);
    }

    if (filterAction) {
      query = query.eq('action', filterAction);
    }

    const { data: auditLogs, error } = await query;

    if (error) throw error;

    // Categorize by risk level
    const highRiskActions = ['delete_patient_record', 'access_sensitive_data', 'modify_prescription'];
    const mediumRiskActions = ['view_patient_record', 'update_appointment', 'export_data'];

    const summary = {
      totalEvents: auditLogs?.length || 0,
      highRiskEvents: auditLogs?.filter(log => highRiskActions.includes(log.action)).length || 0,
      mediumRiskEvents: auditLogs?.filter(log => mediumRiskActions.includes(log.action)).length || 0,
      lowRiskEvents: auditLogs?.filter(log => 
        !highRiskActions.includes(log.action) && !mediumRiskActions.includes(log.action)
      ).length || 0,
      uniqueUsers: new Set(auditLogs?.map(log => log.user_id)).size,
      topActions: getTopActions(auditLogs || []),
      accessPatterns: analyzeAccessPatterns(auditLogs || [])
    };

    // Store the audit report
    await supabase.from('legal_archives').insert({
      document_type: 'hipaa_audit',
      document_data: { summary, logs: auditLogs },
      entity_type: 'organization',
      retention_years: 6,
      jurisdiction: 'USA',
      created_by: user.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        logs: auditLogs,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('HIPAA audit generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getTopActions(logs: any[]): { action: string; count: number }[] {
  const actionCounts: Record<string, number> = {};
  logs.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });
  
  return Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function analyzeAccessPatterns(logs: any[]): any {
  // Detect unusual access patterns
  const userAccessCounts: Record<string, number> = {};
  const hourlyAccess: Record<number, number> = {};
  
  logs.forEach(log => {
    userAccessCounts[log.user_id] = (userAccessCounts[log.user_id] || 0) + 1;
    
    const hour = new Date(log.timestamp).getHours();
    hourlyAccess[hour] = (hourlyAccess[hour] || 0) + 1;
  });

  // Flag users with abnormally high access (>50 events)
  const suspiciousUsers = Object.entries(userAccessCounts)
    .filter(([_, count]) => count > 50)
    .map(([userId, count]) => ({ userId, accessCount: count }));

  // Find unusual access hours (11pm - 6am)
  const afterHoursAccess = Object.entries(hourlyAccess)
    .filter(([hour, _]) => parseInt(hour) >= 23 || parseInt(hour) <= 6)
    .reduce((sum, [_, count]) => sum + count, 0);

  return {
    suspiciousUsers,
    afterHoursAccessCount: afterHoursAccess,
    peakAccessHour: Object.entries(hourlyAccess)
      .sort(([_, a], [__, b]) => b - a)[0]?.[0] || 'N/A'
  };
}
