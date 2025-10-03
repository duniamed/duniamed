import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Bell, Calendar, CheckCircle2, Mail, MessageSquare } from 'lucide-react';

/**
 * C23 ENGAGEMENT - Patient Engagement & Campaigns
 * Patients receive personalized reminders, tasks, education
 * Specialists compose wellness reminders, follow-up templates
 * Clinics track engagement analytics, run preventive campaigns
 */

function EngagementCampaignsContent() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load engagement tasks
    const { data: tasksData } = await supabase
      .from('engagement_tasks')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    setTasks(tasksData || []);

    // Load campaigns (if clinic user)
    const { data: campaignsData } = await supabase
      .from('engagement_campaigns')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    setCampaigns(campaignsData || []);
    setLoading(false);
  };

  const completeTask = async (taskId: string) => {
    const { error } = await supabase
      .from('engagement_tasks')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    } else {
      toast.success('Task completed! Great job!');
      loadData();
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'education': return <MessageSquare className="w-4 h-4" />;
      case 'follow_up': return <Mail className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const incompleteTasks = tasks.filter((t: any) => !t.completed_at);
  const completedTasks = tasks.filter((t: any) => t.completed_at);
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  return (
    <DashboardLayout title="Health Engagement" description="Stay on track with your health goals">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold">Your Health Tasks</h2>
            <InfoTooltip content="Complete these personalized tasks to stay on top of your health. You'll receive reminders through your preferred channels." />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{completedTasks.length} of {tasks.length} tasks completed</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>

          {loading ? (
            <div className="text-center py-8">Loading tasks...</div>
          ) : incompleteTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-600" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">You have no pending health tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incompleteTasks.map((task: any) => (
                <Card key={task.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1 text-primary">
                        {getTaskIcon(task.task_type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge variant="outline">{task.task_type}</Badge>
                          {task.due_date && (
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => completeTask(task.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {completedTasks.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-bold">Completed Tasks</h2>
              <InfoTooltip content="Your health journey progress. Keep up the great work!" />
            </div>

            <div className="space-y-2">
              {completedTasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg opacity-60">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium line-through">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Completed: {new Date(task.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EngagementCampaigns() {
  return (
    <ProtectedRoute>
      <EngagementCampaignsContent />
    </ProtectedRoute>
  );
}
