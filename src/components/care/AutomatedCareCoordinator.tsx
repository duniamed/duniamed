import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface AutomatedCareCoordinatorProps {
  patientId: string;
  carePlanId: string;
}

export function AutomatedCareCoordinator({ patientId, carePlanId }: AutomatedCareCoordinatorProps) {
  const [coordination, setCoordination] = useState<any>(null);
  const { toast } = useToast();

  const coordinateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('automated-care-coordinator', {
        body: { patientId, carePlanId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCoordination(data.coordination);
      toast({
        title: "Care Coordinated",
        description: `${data.coordination.coordination_plan.tasks.length} tasks created`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Coordination Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'medium': return <Clock className="h-4 w-4 text-warning" />;
      default: return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automated Care Coordinator</CardTitle>
        <CardDescription>AI-powered comprehensive care coordination</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={() => coordinateMutation.mutate()} 
          disabled={coordinateMutation.isPending}
        >
          {coordinateMutation.isPending ? 'Coordinating...' : 'Coordinate Care'}
        </Button>

        {coordination && (
          <div className="space-y-6">
            {coordination.coordination_plan.tasks && coordination.coordination_plan.tasks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Care Tasks</h3>
                <div className="space-y-2">
                  {coordination.coordination_plan.tasks.map((task: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getPriorityIcon(task.priority)}
                      <div className="flex-1">
                        <div className="font-medium">{task.task}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Assignee: {task.assignee} • Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {coordination.coordination_plan.follow_ups && coordination.coordination_plan.follow_ups.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Scheduled Follow-ups</h3>
                <div className="space-y-2">
                  {coordination.coordination_plan.follow_ups.map((followUp: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="font-medium">{followUp.specialty}</div>
                      <div className="text-sm text-muted-foreground mt-1">{followUp.reason}</div>
                      <div className="text-sm mt-2">
                        Suggested: {new Date(followUp.suggested_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {coordination.coordination_plan.medication_review?.required && (
              <Card className="border-warning">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Medication Review Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {coordination.coordination_plan.medication_review.concerns.map((concern: string, idx: number) => (
                      <li key={idx}>{concern}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {coordination.gaps_identified && coordination.gaps_identified.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Care Gaps Identified</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {coordination.gaps_identified.map((gap: string, idx: number) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Care Coordination Efficiency</span>
                <Badge variant="outline">{coordination.efficiency_score}%</Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
