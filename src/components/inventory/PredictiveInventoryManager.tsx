import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const PredictiveInventoryManager = ({ clinicId }: { clinicId: string }) => {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const { toast } = useToast();

  const generateForecast = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-inventory-ml', {
        body: { clinicId, forecastDays: 30 }
      });

      if (error) throw error;
      setForecast(data.forecast);
      toast({ title: 'Inventory forecast generated' });
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
          <Package className="h-5 w-5" />
          Predictive Inventory Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={generateForecast} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Generate 30-Day Forecast
        </Button>

        {forecast && (
          <div className="space-y-4">
            {forecast.predictions?.slice(0, 5).map((pred: any, idx: number) => (
              <div key={idx} className="space-y-2 p-3 bg-secondary rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{pred.itemName || `Item ${idx + 1}`}</span>
                  <span className="text-sm text-muted-foreground">
                    Order: {pred.recommendedOrder} units
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Stockout Risk</span>
                    <span>{(pred.stockoutRisk * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={pred.stockoutRisk * 100} />
                </div>
              </div>
            ))}

            {forecast.alerts?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Critical Alerts
                </h4>
                {forecast.alerts.map((alert: string, idx: number) => (
                  <div key={idx} className="text-sm p-2 bg-destructive/10 rounded">
                    {alert}
                  </div>
                ))}
              </div>
            )}

            {forecast.orderRecommendations?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Order Recommendations
                </h4>
                {forecast.orderRecommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="text-sm p-2 bg-primary/10 rounded">
                    {rec}
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
