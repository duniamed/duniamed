import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const StaffScheduleOptimizer = ({ clinicId }: { clinicId: string }) => {
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);

  const optimizeSchedule = async () => {
    setLoading(true);
    try {
      const period = {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data, error } = await supabase.functions.invoke('staff-schedule-optimizer', {
        body: { clinicId, period, constraints: {} }
      });

      if (error) throw error;
      setSchedule(data.schedule);
      toast.success('Schedule optimized');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Staff Schedule Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={optimizeSchedule} disabled={loading}>
          {loading ? 'Optimizing...' : 'Optimize Schedule'}
        </Button>

        {schedule && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cost Savings</span>
                <span className="text-xl font-bold flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {schedule.costSavings.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Satisfaction Score</div>
              <div className="text-2xl font-bold">{schedule.satisfactionScore}/100</div>
            </div>

            {schedule.coverageGaps.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Coverage Gaps
                </h4>
                <ul className="text-sm space-y-1">
                  {schedule.coverageGaps.map((gap: any, idx: number) => (
                    <li key={idx} className="text-destructive">
                      • {gap.date} - {gap.shift}: {gap.missing} staff needed
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {schedule.overstaffedPeriods.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Overstaffed Periods</h4>
                <ul className="text-sm space-y-1">
                  {schedule.overstaffedPeriods.map((period: any, idx: number) => (
                    <li key={idx} className="text-muted-foreground">
                      • {period.date} - {period.shift}: {period.excess} excess staff
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {schedule.swapSuggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Shift Swap Suggestions</h4>
                <ul className="text-sm space-y-1">
                  {schedule.swapSuggestions.map((swap: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">• {swap}</li>
                  ))}
                </ul>
              </div>
            )}

            {schedule.complianceIssues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">Compliance Issues</h4>
                <ul className="text-sm space-y-1">
                  {schedule.complianceIssues.map((issue: string, idx: number) => (
                    <li key={idx} className="text-destructive">• {issue}</li>
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
