import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AutomatedCareCoordinator = ({ carePlanId }: { carePlanId: string }) => {
  const [loading, setLoading] = useState(false);
  const [coordination, setCoordination] = useState<any>(null);
  const { toast } = useToast();

  const coordinateCare = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('automated-care-coordinator', {
        body: { carePlanId }
      });

      if (error) throw error;
      setCoordination(data.coordination);
      toast({ title: 'Care coordination updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Automated Care Coordinator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={coordinateCare} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Coordinate Care Plan
        </Button>

        {coordination && (
          <div className="space-y-4">
            {coordination.gaps?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Care Gaps Identified
                </h4>
                {coordination.gaps.map((gap: string, idx: number) => (
                  <div key={idx} className="text-sm p-3 bg-destructive/10 rounded-lg">
                    {gap}
                  </div>
                ))}
              </div>
            )}

            {coordination.priorityTasks?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Priority Tasks</h4>
                {coordination.priorityTasks.map((task: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-sm">{task.name}</span>
                    <Badge>{task.priority}</Badge>
                  </div>
                ))}
              </div>
            )}

            {coordination.nextActions?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Next Actions
                </h4>
                {coordination.nextActions.map((action: string, idx: number) => (
                  <div key={idx} className="text-sm p-2 bg-primary/10 rounded">
                    {action}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
