import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Clock, Target } from 'lucide-react';

export const CarePlanViewer: React.FC = () => {
  const [carePlans, setCarePlans] = useState<any[]>([]);

  useEffect(() => {
    loadCarePlans();
  }, []);

  const loadCarePlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('patient_care_plans')
        .select(`
          *,
          care_plan_tasks(*)
        `)
        .eq('patient_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setCarePlans(data || []);
    } catch (error) {
      console.error('Load care plans error:', error);
    }
  };

  const calculateProgress = (tasks: any[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return (completed / tasks.length) * 100;
  };

  return (
    <div className="space-y-4">
      {carePlans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {plan.plan_name}
              </CardTitle>
              <Badge>{plan.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(calculateProgress(plan.care_plan_tasks))}%</span>
              </div>
              <Progress value={calculateProgress(plan.care_plan_tasks)} />
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Tasks</h4>
              {plan.care_plan_tasks?.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm">{task.task_name}</span>
                  </div>
                  <Badge variant="outline">{task.task_type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {carePlans.length === 0 && (
        <Card>
          <CardContent className="text-center text-muted-foreground py-8">
            No active care plans
          </CardContent>
        </Card>
      )}
    </div>
  );
};
