// AI Source Registry Management
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

    console.log(`AI Source action: ${action}`);

    switch (action) {
      case 'add_source': {
        const { data: source, error } = await supabase
          .from('ai_source_registry')
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, source }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update_source': {
        const { id, ...updates } = data;
        const { data: source, error } = await supabase
          .from('ai_source_registry')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, source }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'approve_source': {
        const { id } = data;
        const { data: source, error } = await supabase
          .from('ai_source_registry')
          .update({ status: 'approved' })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, source }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'retire_source': {
        const { id } = data;
        const { data: source, error } = await supabase
          .from('ai_source_registry')
          .update({ status: 'retired' })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, source }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'list_sources': {
        const { status } = data || {};
        let query = supabase
          .from('ai_source_registry')
          .select('*')
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data: sources, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, sources }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'check_freshness': {
        const { data: stale, error } = await supabase
          .from('ai_source_registry')
          .select('*')
          .eq('status', 'approved')
          .not('valid_to', 'is', null)
          .lt('valid_to', new Date().toISOString().split('T')[0]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, stale_sources: stale }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error('AI source management error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});