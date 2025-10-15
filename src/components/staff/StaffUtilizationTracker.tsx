import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface StaffUtilizationTrackerProps {
  clinicId: string;
}

export const StaffUtilizationTracker = ({ clinicId }: StaffUtilizationTrackerProps) => {
  const [loading, setLoading] = useState(false);
  const [utilization, setUtilization] = useState<any>(null);
  const { toast } = useToast();

  const trackUtilization = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('staff-utilization-tracker', {
        body: { 
          clinicId,
          period: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      setUtilization(data.utilization);
      toast({
        title: "Utilization Tracked",
        description: `Overall utilization: ${data.utilization.overall_utilization}%`
      });
    } catch (error: any) {
      toast({
        title: "Tracking Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (util: number) => {
    if (util < 60) return 'text-red-500';
    if (util < 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Staff Utilization Tracker</h3>
        </div>
        <Button onClick={trackUtilization} disabled={loading}>
          {loading ? 'Tracking...' : 'Track Utilization'}
        </Button>
      </div>

      {utilization && (
        <div className="space-y-4 mt-4">
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <p className="text-sm text-muted-foreground mb-2">Overall Utilization</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {utilization.overall_utilization}%
            </p>
            <Progress value={utilization.overall_utilization} className="h-2 mt-2" />
          </Card>

          {utilization.staff_metrics?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Staff Performance</p>
              <div className="space-y-3">
                {utilization.staff_metrics.map((staff: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {staff.appointments_handled} appointments
                          </span>
                        </div>
                      </div>
                      <Badge variant={staff.utilization > 80 ? 'default' : 'secondary'}>
                        {staff.utilization}% utilized
                      </Badge>
                    </div>
                    <Progress value={staff.utilization} className="h-2 mb-2" />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Available Hours</p>
                        <p className="text-sm font-medium">{staff.available_hours}h</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Efficiency Score</p>
                        <p className={`text-sm font-medium ${getUtilizationColor(staff.efficiency_score)}`}>
                          {staff.efficiency_score}/100
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {utilization.bottlenecks?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-600">Bottlenecks Identified</p>
              </div>
              <ul className="space-y-1">
                {utilization.bottlenecks.map((bottleneck: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">⚠ {bottleneck}</li>
                ))}
              </ul>
            </div>
          )}

          {utilization.optimization_suggestions?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Optimization Suggestions</p>
              <ul className="space-y-1">
                {utilization.optimization_suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">💡 {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {utilization.capacity_forecast && (
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Capacity Forecast</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Projected Load</p>
                  <p className="text-lg font-bold">{utilization.capacity_forecast.projected_load || 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Additional Staff Needed</p>
                  <p className="text-lg font-bold">{utilization.capacity_forecast.additional_staff || 0}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </Card>
  );
};
