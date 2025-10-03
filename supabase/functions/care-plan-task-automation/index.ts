import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { care_plan_id } = await req.json();

    console.log('Automating care plan tasks:', { care_plan_id });

    // Fetch care plan details
    const { data: carePlan, error: planError } = await supabase
      .from('patient_care_plans')
      .select('*, care_pathways(*)')
      .eq('id', care_plan_id)
      .single();

    if (planError || !carePlan) {
      throw new Error('Care plan not found');
    }

    // Get all pending tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('care_plan_tasks')
      .select('*')
      .eq('care_plan_id', care_plan_id)
      .eq('status', 'pending')
      .order('sequence_order');

    if (tasksError) throw tasksError;

    const automatedTasks = [];
    const now = new Date();

    for (const task of tasks || []) {
      const dueDate = new Date(task.due_date);
      
      // Auto-complete overdue automated tasks
      if (task.task_type === 'automated' && dueDate < now) {
        const { error: updateError } = await supabase
          .from('care_plan_tasks')
          .update({
            status: 'completed',
            completed_at: now.toISOString(),
            completed_by: null // System completed
          })
          .eq('id', task.id);

        if (!updateError) {
          automatedTasks.push({
            task_id: task.id,
            action: 'auto_completed',
            task_name: task.task_name
          });
        }
      }

      // Send reminders for upcoming tasks (1 day before)
      const oneDayBefore = new Date(dueDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      if (now >= oneDayBefore && now < dueDate && task.assigned_to) {
        // Send notification
        await supabase.functions.invoke('send-multi-channel-notification', {
          body: {
            user_id: task.assigned_to,
            title: 'Task Reminder',
            message: `Reminder: "${task.task_name}" is due tomorrow`,
            channels: ['in_app', 'email'],
            data: {
              task_id: task.id,
              care_plan_id: care_plan_id
            }
          }
        });

        automatedTasks.push({
          task_id: task.id,
          action: 'reminder_sent',
          task_name: task.task_name
        });
      }

      // Check dependencies and unlock next tasks
      if (task.status === 'completed' && task.milestone) {
        // Find next tasks in sequence
        const { data: nextTasks } = await supabase
          .from('care_plan_tasks')
          .select('*')
          .eq('care_plan_id', care_plan_id)
          .eq('status', 'pending')
          .gt('sequence_order', task.sequence_order)
          .limit(1);

        if (nextTasks && nextTasks.length > 0) {
          automatedTasks.push({
            task_id: nextTasks[0].id,
            action: 'unlocked',
            task_name: nextTasks[0].task_name
          });
        }
      }
    }

    // Update care plan progress
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await supabase
      .from('patient_care_plans')
      .update({ progress_percentage: progress })
      .eq('id', care_plan_id);

    console.log('Care plan automation complete:', {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      progress,
      automated_actions: automatedTasks.length
    });

    return new Response(JSON.stringify({
      success: true,
      care_plan_id,
      progress,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      automated_actions: automatedTasks
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in care-plan-task-automation:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
