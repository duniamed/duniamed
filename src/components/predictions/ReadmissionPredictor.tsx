import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ReadmissionPredictorProps {
  patientId: string;
  dischargeDate: string;
}

export const ReadmissionPredictor = ({ patientId, dischargeDate }: ReadmissionPredictorProps) => {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const { toast } = useToast();

  const predictReadmission = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-readmission', {
        body: { patientId, dischargeDate }
      });

      if (error) throw error;

      setPrediction(data.prediction);
      toast({
        title: "Prediction Complete",
        description: `Risk Level: ${data.prediction.riskLevel.toUpperCase()}`
      });
    } catch (error: any) {
      toast({
        title: "Prediction Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">30-Day Readmission Predictor</h3>
        </div>
        <Button onClick={predictReadmission} disabled={loading}>
          {loading ? 'Predicting...' : 'Predict Risk'}
        </Button>
      </div>

      {prediction && (
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${getRiskColor(prediction.riskLevel)}`} />
              <span className="font-medium">Risk Score: {(prediction.riskScore * 100).toFixed(0)}%</span>
            </div>
            <Badge variant={prediction.riskLevel === 'high' ? 'destructive' : 'default'}>
              {prediction.riskLevel.toUpperCase()}
            </Badge>
          </div>

          <Progress value={prediction.riskScore * 100} className="h-2" />

          {prediction.keyFactors?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Key Risk Factors</p>
              <ul className="space-y-1">
                {prediction.keyFactors.map((factor: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-500">⚠</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {prediction.interventions?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Recommended Interventions</p>
              <ul className="space-y-1">
                {prediction.interventions.map((intervention: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">• {intervention}</li>
                ))}
              </ul>
            </div>
          )}

          {prediction.followUpSchedule?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Follow-Up Schedule</p>
              <div className="space-y-2">
                {prediction.followUpSchedule.map((schedule: any, index: number) => (
                  <Card key={index} className="p-3">
                    <p className="text-sm font-medium">{schedule.type}</p>
                    <p className="text-xs text-muted-foreground">{schedule.timing}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
