import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { TrendingUp, DollarSign, Users, AlertCircle } from "lucide-react";

export default function PredictiveAnalyticsDashboard() {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<any>(null);
  const [churnAnalysis, setChurnAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const handlePredictRevenue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('revenue-prediction-ml', {
        body: {
          clinicId: 'clinic-id',
          forecastMonths: 6
        }
      });

      if (error) throw error;

      setPredictions(data.prediction);
      toast({
        title: "Revenue Predicted",
        description: `Growth rate: ${data.prediction.growth_rate}%`
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

  const handleAnalyzeChurn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-churn-prediction', {
        body: {
          clinicId: 'clinic-id'
        }
      });

      if (error) throw error;

      setChurnAnalysis(data.churnAnalysis);
      toast({
        title: "Churn Analysis Complete",
        description: `${data.churnAnalysis.at_risk_patients?.length || 0} patients at risk`
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-bold">Predictive Analytics</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Forecasting</h3>
          <Button onClick={handlePredictRevenue} disabled={loading} className="w-full">
            Generate 6-Month Forecast
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Patient Churn Analysis</h3>
          <Button onClick={handleAnalyzeChurn} disabled={loading} className="w-full">
            Analyze Churn Risk
          </Button>
        </Card>
      </div>

      {predictions && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Predictions</h3>
          <div className="space-y-3">
            {predictions.predictions?.map((pred: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium">{pred.month}</p>
                    <p className="text-sm text-muted-foreground">
                      Range: ${pred.confidence_interval?.[0]} - ${pred.confidence_interval?.[1]}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold">${pred.predicted_revenue?.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">Growth Rate:</span> {predictions.growth_rate}%
            </p>
          </div>
        </Card>
      )}

      {churnAnalysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">At-Risk Patients</h3>
          <div className="mb-4 p-4 bg-warning/10 border border-warning rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <p className="font-semibold">
                Overall Churn Rate: {churnAnalysis.overall_churn_rate}%
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {churnAnalysis.at_risk_patients?.map((patient: any, idx: number) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">Patient {idx + 1}</p>
                  </div>
                  <Badge variant="destructive">
                    {Math.round(patient.churn_probability * 100)}% Risk
                  </Badge>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">Risk Factors:</p>
                  <ul className="list-disc list-inside">
                    {patient.risk_factors?.map((factor: string, i: number) => (
                      <li key={i}>{factor}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
