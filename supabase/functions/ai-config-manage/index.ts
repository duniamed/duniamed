import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
      throw new Error('Unauthorized');
    }

    // Verify admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const { action, config, configId } = await req.json();

    switch (action) {
      case 'create':
        return await createConfig(supabase, user.id, config);
      case 'update':
        return await updateConfig(supabase, user.id, configId, config);
      case 'approve':
        return await approveConfig(supabase, user.id, configId, config.justification);
      case 'rollback':
        return await rollbackConfig(supabase, user.id, configId, config.targetVersion);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createConfig(supabase: any, userId: string, config: any) {
  const { data, error } = await supabase
    .from('ai_config_profiles')
    .insert({
      ...config,
      created_by: userId,
      version: 1,
      is_active: false,
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateConfig(supabase: any, userId: string, configId: string, updates: any) {
  // Get current version
  const { data: current } = await supabase
    .from('ai_config_profiles')
    .select('version')
    .eq('id', configId)
    .single();

  const { data, error } = await supabase
    .from('ai_config_profiles')
    .update({
      ...updates,
      version: (current?.version || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', configId)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function approveConfig(supabase: any, userId: string, configId: string, justification: string) {
  const { data, error } = await supabase
    .from('ai_config_profiles')
    .update({
      is_active: true,
      approved_by: userId,
      change_note: justification,
    })
    .eq('id', configId)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function rollbackConfig(supabase: any, userId: string, configId: string, targetVersion: number) {
  // Get target version config
  const { data: target } = await supabase
    .from('ai_config_profiles')
    .select('*')
    .eq('id', configId)
    .eq('version', targetVersion)
    .single();

  if (!target) {
    throw new Error('Target version not found');
  }

  // Create new version with target config
  const { data, error } = await supabase
    .from('ai_config_profiles')
    .insert({
      ...target,
      version: target.version + 1,
      change_note: `Rollback to version ${targetVersion}`,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
