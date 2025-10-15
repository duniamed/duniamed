// Admin AI Configuration Management
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

    const { action, data } = await req.json();

    console.log(`AI Config action: ${action}`);

    switch (action) {
      case 'create_profile': {
        const { data: profile, error } = await supabase
          .from('ai_config_profiles')
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        // Log audit
        await supabase.from('ai_policy_audit').insert({
          config_id: profile.id,
          action: 'create',
          actor_id: data.created_by,
          diff: { new: profile },
          justification: data.change_note || 'New configuration created'
        });

        return new Response(JSON.stringify({ success: true, profile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update_profile': {
        const { id, ...updates } = data;
        const { data: oldProfile } = await supabase
          .from('ai_config_profiles')
          .select()
          .eq('id', id)
          .single();

        const { data: profile, error } = await supabase
          .from('ai_config_profiles')
          .update({ ...updates, version: (oldProfile?.version || 0) + 1 })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Log audit
        await supabase.from('ai_policy_audit').insert({
          config_id: id,
          action: 'update',
          actor_id: updates.updated_by,
          diff: { old: oldProfile, new: profile },
          justification: updates.change_note || 'Configuration updated'
        });

        return new Response(JSON.stringify({ success: true, profile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'approve_profile': {
        const { id, approved_by, justification } = data;
        const { data: profile, error } = await supabase
          .from('ai_config_profiles')
          .update({ is_active: true, approved_by })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await supabase.from('ai_policy_audit').insert({
          config_id: id,
          action: 'approve',
          actor_id: approved_by,
          diff: { approved: true },
          justification
        });

        return new Response(JSON.stringify({ success: true, profile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'rollback_profile': {
        const { id, version, rolled_back_by, justification } = data;
        const { data: targetVersion } = await supabase
          .from('ai_config_profiles')
          .select()
          .eq('id', id)
          .eq('version', version)
          .single();

        if (!targetVersion) {
          throw new Error('Target version not found');
        }

        const { data: profile, error } = await supabase
          .from('ai_config_profiles')
          .update({ 
            ...targetVersion,
            is_active: true,
            version: targetVersion.version + 1
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await supabase.from('ai_policy_audit').insert({
          config_id: id,
          action: 'rollback',
          actor_id: rolled_back_by,
          diff: { rolled_back_to: version },
          justification
        });

        return new Response(JSON.stringify({ success: true, profile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'list_profiles': {
        const { data: profiles, error } = await supabase
          .from('ai_config_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, profiles }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_audit_trail': {
        const { config_id } = data;
        const { data: trail, error } = await supabase
          .from('ai_policy_audit')
          .select('*')
          .eq('config_id', config_id)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, trail }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error('AI config management error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});