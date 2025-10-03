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
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, queueId, itemId, clinicId } = await req.json();

    switch (action) {
      case 'get_queues': {
        const { data: queues } = await supabase
          .from('work_queues')
          .select(`
            *,
            work_queue_items (
              count
            )
          `)
          .eq('clinic_id', clinicId)
          .eq('is_active', true);

        return new Response(
          JSON.stringify({ queues }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_queue_items': {
        const { data: items } = await supabase
          .from('work_queue_items')
          .select('*')
          .eq('queue_id', queueId)
          .in('status', ['pending', 'assigned', 'in_progress'])
          .order('urgency', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(50);

        return new Response(
          JSON.stringify({ items }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'claim_item': {
        const now = new Date().toISOString();
        
        // Try to claim the item atomically
        const { data: item, error } = await supabase
          .from('work_queue_items')
          .update({
            assigned_to: user.id,
            assigned_at: now,
            status: 'assigned'
          })
          .eq('id', itemId)
          .eq('status', 'pending') // Only claim if still pending
          .select()
          .single();

        if (error || !item) {
          return new Response(
            JSON.stringify({ error: 'Item already claimed or not found' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, item }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'start_work': {
        const now = new Date().toISOString();
        
        const { data: item } = await supabase
          .from('work_queue_items')
          .update({
            status: 'in_progress',
            first_viewed_at: now
          })
          .eq('id', itemId)
          .eq('assigned_to', user.id)
          .select()
          .single();

        // Calculate time to first view
        if (item) {
          const created = new Date(item.created_at);
          const viewed = new Date(now);
          const minutes = Math.floor((viewed.getTime() - created.getTime()) / 60000);

          await supabase
            .from('work_queue_items')
            .update({ time_to_first_view_minutes: minutes })
            .eq('id', itemId);
        }

        return new Response(
          JSON.stringify({ success: true, item }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'complete_item': {
        const now = new Date().toISOString();
        
        const { data: item } = await supabase
          .from('work_queue_items')
          .select('created_at')
          .eq('id', itemId)
          .single();

        if (item) {
          const created = new Date(item.created_at);
          const completed = new Date(now);
          const minutes = Math.floor((completed.getTime() - created.getTime()) / 60000);

          await supabase
            .from('work_queue_items')
            .update({
              status: 'completed',
              completed_at: now,
              time_to_completion_minutes: minutes
            })
            .eq('id', itemId)
            .eq('assigned_to', user.id);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'defer_item': {
        const { deferUntil, reason } = await req.json();
        
        await supabase
          .from('work_queue_items')
          .update({
            status: 'pending',
            assigned_to: null,
            assigned_at: null
          })
          .eq('id', itemId)
          .eq('assigned_to', user.id);

        // TODO: Add to batch for deferred processing
        // TODO: Log defer reason for analytics

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'escalate_item': {
        const { escalationReason } = await req.json();
        
        await supabase
          .from('work_queue_items')
          .update({
            status: 'escalated',
            requires_md_review: true
          })
          .eq('id', itemId);

        // TODO: Send escalation notification
        // TODO: Log escalation for analytics

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_metrics': {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: metrics } = await supabase
          .from('evening_load_metrics')
          .select('*')
          .eq('user_id', user.id)
          .eq('metric_date', today)
          .single();

        return new Response(
          JSON.stringify({ metrics: metrics || null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'track_evening_work': {
        const { durationMinutes, activityType } = await req.json();
        const today = new Date().toISOString().split('T')[0];
        const currentHour = new Date().getHours();
        
        // Only track if outside business hours (8am-6pm)
        if (currentHour < 8 || currentHour >= 18) {
          const { data: existing } = await supabase
            .from('evening_load_metrics')
            .select('*')
            .eq('user_id', user.id)
            .eq('metric_date', today)
            .single();

          if (existing) {
            await supabase
              .from('evening_load_metrics')
              .update({
                after_hours_minutes: existing.after_hours_minutes + durationMinutes,
                inbox_time_minutes: activityType === 'inbox' 
                  ? existing.inbox_time_minutes + durationMinutes
                  : existing.inbox_time_minutes,
                documentation_time_minutes: activityType === 'documentation'
                  ? existing.documentation_time_minutes + durationMinutes
                  : existing.documentation_time_minutes
              })
              .eq('id', existing.id);
          } else {
            await supabase
              .from('evening_load_metrics')
              .insert({
                user_id: user.id,
                clinic_id: clinicId,
                metric_date: today,
                after_hours_minutes: durationMinutes,
                inbox_time_minutes: activityType === 'inbox' ? durationMinutes : 0,
                documentation_time_minutes: activityType === 'documentation' ? durationMinutes : 0
              });
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});