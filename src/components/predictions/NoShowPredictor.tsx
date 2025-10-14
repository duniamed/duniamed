import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function NoShowPredictor() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('no-show-prediction', {
        body: {
          appointment_id: 'apt-123',
          patient_id: 'patient-123'
        }
      });

      if (error) throw error;

      setPrediction(data.prediction);
      toast({
        title: "Prediction Complete",
        description: `Risk level: ${data.prediction.risk_level}`,
      });
    } catch (error: any) {
      toast({
        title: "Prediction Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">No-Show Risk Predictor</h3>
        </div>

        <Button onClick={handlePredict} disabled={loading}>
          Analyze Risk
        </Button>
      </Card>

      {prediction && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {prediction.risk_level === 'high' ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle className="h-5 w-5 text-success" />
              )}
              <h4 className="font-medium">Risk Assessment</h4>
            </div>
            <Badge variant={getRiskColor(prediction.risk_level)}>
              {prediction.risk_level.toUpperCase()}
            </Badge>
          </div>

          <div className="p-4 bg-secondary rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">No-Show Probability</span>
              <span className="text-2xl font-bold">
                {Math.round(prediction.no_show_probability * 100)}%
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${prediction.no_show_probability * 100}%` }}
              />
            </div>
          </div>

          {prediction.risk_factors?.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Risk Factors</h5>
              <ul className="space-y-1">
                {prediction.risk_factors.map((factor: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {prediction.recommendations?.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recommendations
              </h5>
              <ul className="space-y-1">
                {prediction.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-success">✓</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {prediction.optimal_reminder_frequency && (
            <div className="p-3 border rounded">
              <p className="text-sm font-medium">Optimal Reminder Strategy</p>
              <p className="text-xs text-muted-foreground mt-1">
                {prediction.optimal_reminder_frequency}
              </p>
            </div>
          )}

          {prediction.suggested_interventions?.length > 0 && (
            <div className="p-3 bg-primary/10 rounded">
              <p className="text-sm font-medium mb-2">Suggested Interventions</p>
              <ul className="space-y-1">
                {prediction.suggested_interventions.map((intervention: string, idx: number) => (
                  <li key={idx} className="text-xs">{intervention}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
