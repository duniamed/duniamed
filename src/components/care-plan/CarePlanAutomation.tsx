import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CarePlanAutomationProps {
  patientId: string;
}

export const CarePlanAutomation: React.FC<CarePlanAutomationProps> = ({ patientId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: carePlans } = useQuery({
    queryKey: ['care-plans', patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('patient_care_plans')
        .select('*, care_pathways(*), care_plan_tasks(*)')
        .eq('patient_id', patientId)
        .eq('status', 'active');
      return data || [];
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('care_plan_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Task Completed",
        description: "Care plan task marked as complete",
      });
      queryClient.invalidateQueries({ queryKey: ['care-plans', patientId] });
    }
  });

  const getTaskIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {carePlans?.map((plan: any) => (
        <Card key={plan.id}>
          <CardHeader>
            <CardTitle>{plan.care_pathways?.name || 'Care Plan'}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {plan.care_pathways?.description}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan.care_plan_tasks
              ?.sort((a: any, b: any) => a.sequence_order - b.sequence_order)
              .map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTaskIcon(task.status)}
                    <div>
                      <p className="font-medium">{task.task_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {task.status !== 'completed' && (
                    <Button
                      size="sm"
                      onClick={() => completeTaskMutation.mutate(task.id)}
                      disabled={completeTaskMutation.isPending}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      ))}

      {(!carePlans || carePlans.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No active care plans</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
