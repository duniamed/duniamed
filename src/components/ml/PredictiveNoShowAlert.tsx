import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PredictiveNoShowAlertProps {
  appointmentId: string;
  patientId: string;
}

export function PredictiveNoShowAlert({ appointmentId, patientId }: PredictiveNoShowAlertProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['no-show-prediction', appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('predictive-no-show-ml', {
        body: { appointmentId, patientId }
      });
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div className="text-muted-foreground">Analyzing...</div>;

  const prediction = data?.prediction;
  if (!prediction) return null;

  const getRiskColor = (probability: number) => {
    if (probability > 0.7) return "destructive";
    if (probability > 0.4) return "default";
    return "secondary";
  };

  const getRiskIcon = (probability: number) => {
    if (probability > 0.7) return <AlertTriangle className="h-4 w-4" />;
    if (probability > 0.4) return <TrendingUp className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getRiskIcon(prediction.noShowProbability)}
          No-Show Risk Assessment
        </CardTitle>
        <CardDescription>
          AI-powered prediction based on patient history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Risk Level:</span>
          <Badge variant={getRiskColor(prediction.noShowProbability)}>
            {Math.round(prediction.noShowProbability * 100)}% probability
          </Badge>
        </div>

        {prediction.riskFactors?.length > 0 && (
          <Alert>
            <AlertTitle>Risk Factors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {prediction.riskFactors.map((factor: string, i: number) => (
                  <li key={i} className="text-sm">{factor}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {prediction.interventionRecommendations?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Recommended Actions:</h4>
            <ul className="space-y-2">
              {prediction.interventionRecommendations.map((rec: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
