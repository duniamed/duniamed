import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

export const MLScheduleOptimizer: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [optimization, setOptimization] = useState<any>(null);

  const optimizeSchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ml-schedule-optimizer', {
        body: {
          clinicId: 'clinic-uuid',
          dateRange: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          constraints: {
            maxConsecutiveAppointments: 8,
            breakDuration: 30,
            preferredStartTime: '09:00',
            preferredEndTime: '17:00'
          }
        }
      });

      if (error) throw error;
      setOptimization(data.optimization);
      
      toast({
        title: "Schedule Optimized",
        description: `Efficiency score: ${data.optimization.efficiency_score}%`,
      });
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          ML Schedule Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={optimizeSchedule} disabled={loading} className="w-full">
          {loading ? 'Optimizing...' : 'Optimize Schedule'}
        </Button>

        {optimization && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{optimization.efficiency_score}%</div>
                  <div className="text-sm text-muted-foreground">Efficiency Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{optimization.predicted_utilization}%</div>
                  <div className="text-sm text-muted-foreground">Predicted Utilization</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{optimization.optimal_schedule.length}</div>
                  <div className="text-sm text-muted-foreground">Optimal Slots</div>
                </CardContent>
              </Card>
            </div>

            {optimization.bottlenecks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Bottlenecks Identified
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {optimization.bottlenecks.map((bottleneck: string, idx: number) => (
                    <li key={idx} className="text-sm">{bottleneck}</li>
                  ))}
                </ul>
              </div>
            )}

            {optimization.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Recommendations
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {optimization.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
