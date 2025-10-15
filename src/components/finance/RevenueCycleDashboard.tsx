import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const RevenueCycleDashboard = ({ clinicId }: { clinicId: string }) => {
  const [loading, setLoading] = useState(false);
  const [rcm, setRcm] = useState<any>(null);

  const analyzeRevenue = async () => {
    setLoading(true);
    try {
      const period = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };

      const { data, error } = await supabase.functions.invoke('revenue-cycle-management', {
        body: { clinicId, period, action: 'analyze' }
      });

      if (error) throw error;
      setRcm(data.rcm);
      toast.success('Revenue cycle analyzed');
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
          <DollarSign className="h-5 w-5" />
          Revenue Cycle Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={analyzeRevenue} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Revenue Cycle'}
        </Button>

        {rcm && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {rcm.totalRevenue.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Outstanding Claims</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {rcm.outstandingClaims.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Denial Rate</div>
                <div className="text-xl font-bold text-destructive">{rcm.denialRate.toFixed(1)}%</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Collection Rate</div>
                <div className="text-xl font-bold text-success">{rcm.collectionRate.toFixed(1)}%</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Days to Payment
                </div>
                <div className="text-xl font-bold">{rcm.averageDaysToPayment}</div>
              </div>
            </div>

            {rcm.denialReasons.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Top Denial Reasons
                </h4>
                <ul className="text-sm space-y-1">
                  {rcm.denialReasons.map((reason: any, idx: number) => (
                    <li key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">{reason.reason}</span>
                      <span className="font-medium">{reason.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rcm.bottlenecks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">Bottlenecks</h4>
                <ul className="text-sm space-y-1">
                  {rcm.bottlenecks.map((bottleneck: string, idx: number) => (
                    <li key={idx} className="text-destructive">• {bottleneck}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Predicted Revenue (30d)
                </span>
                <span className="text-xl font-bold flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {rcm.predictedRevenue.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recommendations</h4>
              <ul className="text-sm space-y-1">
                {rcm.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
