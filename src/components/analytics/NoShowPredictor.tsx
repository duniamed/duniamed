import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const NoShowPredictor = ({ appointmentId, patientId }: { appointmentId: string; patientId: string }) => {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  const analyzePrediction = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-no-show-analytics', {
        body: { appointmentId, patientId, historicalData: {} }
      });

      if (error) throw error;
      setPrediction(data.prediction);
      toast.success('No-show prediction analyzed');
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
          <TrendingUp className="h-5 w-5" />
          No-Show Risk Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={analyzePrediction} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Risk'}
        </Button>

        {prediction && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {prediction.noShowProbability > 0.7 ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-success" />
              )}
              <span className="font-medium">
                Risk Level: {(prediction.noShowProbability * 100).toFixed(0)}%
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Risk Factors:</h4>
              <ul className="text-sm space-y-1">
                {prediction.riskFactors.map((factor: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {factor}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recommendations:</h4>
              <ul className="text-sm space-y-1">
                {prediction.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {rec}</li>
                ))}
              </ul>
            </div>

            <div className="text-sm">
              <span className="font-medium">Optimal Reminder: </span>
              <span className="text-muted-foreground">{prediction.optimalReminderTiming}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
