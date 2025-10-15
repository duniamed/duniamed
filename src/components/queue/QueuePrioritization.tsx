import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListOrdered, AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface QueuePrioritizationProps {
  clinicId: string;
  queueType: 'waitlist' | 'appointments';
}

export const QueuePrioritization = ({ clinicId, queueType }: QueuePrioritizationProps) => {
  const [loading, setLoading] = useState(false);
  const [prioritization, setPrioritization] = useState<any>(null);
  const { toast } = useToast();

  const prioritizeQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('queue-prioritization-ai', {
        body: { clinicId, queueType }
      });

      if (error) throw error;

      setPrioritization(data.prioritization);
      toast({
        title: "Queue Prioritized",
        description: `${data.prioritization.prioritizedQueue?.length} patients sorted by urgency`
      });
    } catch (error: any) {
      toast({
        title: "Prioritization Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority > 0.7) return 'text-red-500';
    if (priority > 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Queue Prioritization</h3>
        </div>
        <Button onClick={prioritizeQueue} disabled={loading}>
          {loading ? 'Prioritizing...' : 'Prioritize Queue'}
        </Button>
      </div>

      {prioritization && (
        <div className="space-y-4 mt-4">
          {prioritization.criticalCases?.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {prioritization.criticalCases.length} Critical Cases Require Immediate Attention
                </p>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Prioritized Queue</p>
            <div className="space-y-2">
              {prioritization.prioritizedQueue?.slice(0, 10).map((patient: any, index: number) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">#{index + 1}</span>
                        <Badge variant="outline" className={getPriorityColor(patient.priority)}>
                          Priority: {(patient.priority * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{patient.urgencyReason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Suggested: {patient.suggestedAction} | Wait: {patient.estimatedWaitTime}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {prioritization.statistics && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-3">
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{prioritization.statistics.total || 0}</p>
              </Card>
              <Card className="p-3">
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-red-500">{prioritization.statistics.highPriority || 0}</p>
              </Card>
              <Card className="p-3">
                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                <p className="text-2xl font-bold">{prioritization.statistics.avgWaitTime || '0min'}</p>
              </Card>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
