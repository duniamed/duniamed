import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, AlertCircle, Activity } from 'lucide-react';
import { toast } from 'sonner';

export const PopulationHealthDashboard = ({ clinicId }: { clinicId: string }) => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  const analyzePopulation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('population-health-analytics', {
        body: {
          clinicId,
          populationSegment: 'all',
          timeframe: '12months'
        }
      });

      if (error) throw error;
      setAnalytics(data.analytics);
      toast.success('Population analysis complete');
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
          <Users className="h-5 w-5" />
          Population Health Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={analyzePopulation} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Population'}
        </Button>

        {analytics && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">High Risk</div>
                <div className="text-2xl font-bold text-destructive">
                  {analytics.riskStratification.high}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Medium Risk</div>
                <div className="text-2xl font-bold text-warning">
                  {analytics.riskStratification.medium}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Low Risk</div>
                <div className="text-2xl font-bold text-success">
                  {analytics.riskStratification.low}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Prevalent Conditions
              </h4>
              <ul className="text-sm space-y-1">
                {analytics.prevalentConditions.map((condition: any, idx: number) => (
                  <li key={idx} className="flex justify-between">
                    <span className="text-muted-foreground">{condition.name}</span>
                    <span className="font-medium">{condition.count} patients</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                Care Gaps
              </h4>
              <ul className="text-sm space-y-1">
                {analytics.careGaps.map((gap: string, idx: number) => (
                  <li key={idx} className="text-destructive">• {gap}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Cost Drivers</h4>
              <ul className="text-sm space-y-1">
                {analytics.costDrivers.map((driver: any, idx: number) => (
                  <li key={idx} className="flex justify-between">
                    <span className="text-muted-foreground">{driver.category}</span>
                    <span className="font-medium">${driver.cost.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Intervention Opportunities
              </h4>
              <ul className="text-sm space-y-1">
                {analytics.interventionOpportunities.map((opp: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {opp}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Predicted Admissions (30d)</h4>
              <div className="text-2xl font-bold">{analytics.predictedAdmissions.length}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
