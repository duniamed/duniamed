import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Circle, Clock, Activity } from 'lucide-react';

interface CarePlan {
  id: string;
  pathway_id: string;
  start_date: string;
  target_end_date?: string;
  status: string;
  adherence_score?: number;
  pathway?: any;
  tasks?: Task[];
}

interface Task {
  id: string;
  task_name: string;
  description?: string;
  task_type: string;
  due_date?: string;
  status: string;
  milestone: boolean;
  sequence_order?: number;
}

export default function CarePathways() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarePlans();
  }, [user]);

  const loadCarePlans = async () => {
    try {
      if (profile?.role === 'patient') {
        const { data, error } = await supabase
          .from('patient_care_plans')
          .select(`
            *,
            pathway:care_pathways(*)
          `)
          .eq('patient_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Load tasks for each care plan
        const plansWithTasks = await Promise.all(
          (data || []).map(async (plan) => {
            const { data: tasks } = await supabase
              .from('care_plan_tasks')
              .select('*')
              .eq('care_plan_id', plan.id)
              .order('sequence_order', { ascending: true });
            
            return { ...plan, tasks: tasks || [] };
          })
        );

        setCarePlans(plansWithTasks);
      } else if (profile?.role === 'specialist') {
        const { data: specialist } = await supabase
          .from('specialists')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (!specialist) return;

        const { data, error } = await supabase
          .from('patient_care_plans')
          .select(`
            *,
            pathway:care_pathways(*)
          `)
          .eq('specialist_id', specialist.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const plansWithTasks = await Promise.all(
          (data || []).map(async (plan) => {
            const { data: tasks } = await supabase
              .from('care_plan_tasks')
              .select('*')
              .eq('care_plan_id', plan.id)
              .order('sequence_order', { ascending: true });
            
            return { ...plan, tasks: tasks || [] };
          })
        );

        setCarePlans(plansWithTasks);
      }
    } catch (error) {
      console.error('Error loading care plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load care plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string, carePlanId: string) => {
    try {
      const { error } = await supabase
        .from('care_plan_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user?.id,
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task marked as completed',
      });

      loadCarePlans();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete task',
        variant: 'destructive',
      });
    }
  };

  const getTaskIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const calculateProgress = (tasks: Task[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Care Pathways</h1>
            <p className="text-muted-foreground">Track your care journey and milestones</p>
          </div>
        </div>

        {carePlans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No active care plans
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">Active Plans</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {carePlans
                .filter(plan => plan.status === 'active')
                .map((plan) => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{plan.pathway?.name || 'Care Plan'}</CardTitle>
                          <CardDescription className="mt-1">
                            {plan.pathway?.description}
                          </CardDescription>
                        </div>
                        <Badge>{plan.status}</Badge>
                      </div>
                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{calculateProgress(plan.tasks || [])}%</span>
                        </div>
                        <Progress value={calculateProgress(plan.tasks || [])} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <h4 className="font-medium">Tasks & Milestones</h4>
                        <div className="space-y-2">
                          {(plan.tasks || []).map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3 flex-1">
                                {getTaskIcon(task.status)}
                                <div>
                                  <p className="font-medium">{task.task_name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {task.task_type}
                                    </Badge>
                                    {task.due_date && (
                                      <span className="text-xs text-muted-foreground">
                                        Due: {new Date(task.due_date).toLocaleDateString()}
                                      </span>
                                    )}
                                    {task.milestone && (
                                      <Badge variant="secondary" className="text-xs">
                                        Milestone
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {task.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleCompleteTask(task.id, plan.id)}
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {carePlans
                .filter(plan => plan.status === 'completed')
                .map((plan) => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <CardTitle>{plan.pathway?.name || 'Care Plan'}</CardTitle>
                      <Badge variant="secondary">Completed</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Completed on {new Date(plan.target_end_date || '').toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}