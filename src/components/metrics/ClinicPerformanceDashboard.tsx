import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Clock } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface ClinicPerformanceDashboardProps {
  clinicId: string;
}

export const ClinicPerformanceDashboard = ({ clinicId }: ClinicPerformanceDashboardProps) => {
  const [loading, setLoading] = useState(false);
  const [performance, setPerformance] = useState<any>(null);
  const { toast } = useToast();

  const analyzePerformance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clinic-performance-metrics', {
        body: { 
          clinicId,
          period: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          },
          metrics: ['patient_satisfaction', 'productivity', 'revenue', 'utilization']
        }
      });

      if (error) throw error;

      setPerformance(data.performance);
      toast({
        title: "Performance Analysis Complete",
        description: `Overall score: ${data.performance.overall_score}/100`
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Clinic Performance Metrics</h3>
        </div>
        <Button onClick={analyzePerformance} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Performance'}
        </Button>
      </div>

      {performance && (
        <div className="space-y-4 mt-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Overall Performance Score</p>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {performance.overall_score}/100
            </p>
            <Progress value={performance.overall_score} className="h-2 mt-2" />
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Patient Satisfaction</p>
              </div>
              <p className="text-2xl font-bold">{performance.patient_satisfaction}%</p>
              <Progress value={performance.patient_satisfaction} className="h-2 mt-2" />
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <p className="text-sm text-muted-foreground">Specialist Productivity</p>
              </div>
              <p className="text-2xl font-bold">{performance.specialist_productivity}%</p>
              <Progress value={performance.specialist_productivity} className="h-2 mt-2" />
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">Utilization Rate</p>
              </div>
              <p className="text-2xl font-bold">{performance.utilization_rate}%</p>
              <Progress value={performance.utilization_rate} className="h-2 mt-2" />
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
              </div>
              <p className="text-2xl font-bold">{performance.wait_time_avg}min</p>
            </Card>
          </div>

          {performance.revenue_performance && (
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Revenue Performance</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                  <p className="text-lg font-bold">${performance.revenue_performance.monthly?.toFixed(0) || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Growth</p>
                  <p className="text-lg font-bold text-green-600">
                    +{performance.revenue_performance.growth_percent?.toFixed(1) || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="text-lg font-bold">${performance.revenue_performance.target?.toFixed(0) || 0}</p>
                </div>
              </div>
            </Card>
          )}

          {performance.trends?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Key Trends</p>
              <ul className="space-y-1">
                {performance.trends.map((trend: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">📊 {trend}</li>
                ))}
              </ul>
            </div>
          )}

          {performance.recommendations?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Recommendations</p>
              <ul className="space-y-1">
                {performance.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">💡 {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {performance.benchmarks && (
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Industry Benchmarks</p>
              <div className="space-y-2">
                {Object.entries(performance.benchmarks).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium">{value}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </Card>
  );
};
