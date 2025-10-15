import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface AIScheduleOptimizerProps {
  clinicId: string;
}

export const AIScheduleOptimizer = ({ clinicId }: AIScheduleOptimizerProps) => {
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<any>(null);
  const { toast } = useToast();

  const optimizeSchedule = async () => {
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-schedule-optimizer', {
        body: { 
          clinicId,
          optimizationPeriod: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          constraints: {
            maxDailyHours: 8,
            minimizeGaps: true,
            balanceWorkload: true
          }
        }
      });

      if (error) throw error;

      setOptimization(data.optimization);
      toast({
        title: "Schedule Optimized",
        description: `Utilization improved by ${(data.optimization.improvements.utilizationIncrease * 100).toFixed(0)}%`
      });
    } catch (error: any) {
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Schedule Optimizer</h3>
        </div>
        <Button onClick={optimizeSchedule} disabled={optimizing}>
          <Zap className={`h-4 w-4 mr-2 ${optimizing ? 'animate-pulse' : ''}`} />
          {optimizing ? 'Optimizing...' : 'Optimize Schedule'}
        </Button>
      </div>

      {optimization && (
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-sm font-medium">Utilization</p>
              </div>
              <p className="text-2xl font-bold">+{(optimization.improvements.utilizationIncrease * 100).toFixed(0)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Gaps Reduced</p>
              <p className="text-2xl font-bold">{optimization.improvements.gapsReduced}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Wait Time</p>
              <p className="text-2xl font-bold">-{optimization.improvements.waitTimeReduction}min</p>
            </Card>
          </div>

          {optimization.recommendations?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Recommendations</p>
              <ul className="space-y-1">
                {optimization.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {optimization.conflicts?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-yellow-600">Conflicts to Resolve</p>
              <ul className="space-y-1">
                {optimization.conflicts.map((conflict: any, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">⚠ {conflict.description}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
