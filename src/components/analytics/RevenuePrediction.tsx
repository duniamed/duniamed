import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenuePredictionProps {
  clinicId: string;
  forecastMonths?: number;
}

export function RevenuePrediction({ clinicId, forecastMonths = 6 }: RevenuePredictionProps) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const { toast } = useToast();

  const generateForecast = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('revenue-prediction-ml', {
        body: { clinicId, forecastMonths }
      });

      if (error) throw error;

      setPrediction(data.prediction);
      toast({
        title: 'Forecast Generated',
        description: `Revenue prediction for ${forecastMonths} months`,
      });
    } catch (error: any) {
      toast({
        title: 'Prediction Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          ML Revenue Prediction
        </CardTitle>
        <CardDescription>AI-powered revenue forecasting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={generateForecast} disabled={loading} className="w-full">
          {loading ? 'Generating Forecast...' : 'Generate Revenue Forecast'}
        </Button>

        {prediction && (
          <div className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prediction.revenue_forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="predicted_revenue"
                    stroke="hsl(var(--primary))"
                    name="Predicted Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence_interval.high"
                    stroke="hsl(var(--primary) / 0.3)"
                    strokeDasharray="5 5"
                    name="Upper Bound"
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence_interval.low"
                    stroke="hsl(var(--primary) / 0.3)"
                    strokeDasharray="5 5"
                    name="Lower Bound"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {prediction.key_drivers && (
              <div>
                <h4 className="font-medium mb-2">Key Revenue Drivers</h4>
                <div className="space-y-2">
                  {prediction.key_drivers.map((driver: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span>{driver.factor}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${driver.impact_score * 100}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground">{driver.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prediction.recommendations && (
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <div className="space-y-1">
                  {prediction.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Target className="h-4 w-4 text-primary mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
