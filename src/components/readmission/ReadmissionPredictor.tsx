import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, TrendingUp } from "lucide-react";

export default function ReadmissionPredictor() {
  const [dischargeDate, setDischargeDate] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const { toast } = useToast();

  const analyzePrediction = async () => {
    if (!dischargeDate) {
      toast({ title: "Missing discharge date", variant: "destructive" });
      return;
    }

    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('predictive-readmission', {
        body: { patientId: user.id, dischargeDate }
      });

      if (error) throw error;

      setPrediction(data.prediction);
      toast({
        title: "Analysis Complete",
        description: `Readmission risk: ${data.prediction.risk_score}%`
      });
    } catch (error: any) {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-amber-600";
    return "text-green-600";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          30-Day Readmission Predictor
        </CardTitle>
        <CardDescription>AI-powered readmission risk analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dischargeDate">Discharge Date</Label>
          <Input
            id="dischargeDate"
            type="date"
            value={dischargeDate}
            onChange={(e) => setDischargeDate(e.target.value)}
          />
        </div>

        {prediction && (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${getRiskColor(prediction.risk_score)}`} />
              <div>
                <p className="text-sm text-muted-foreground">Readmission Risk</p>
                <p className={`text-2xl font-bold ${getRiskColor(prediction.risk_score)}`}>
                  {prediction.risk_score}%
                </p>
              </div>
            </div>

            {prediction.risk_factors && prediction.risk_factors.length > 0 && (
              <div>
                <p className="font-medium mb-2">Risk Factors:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {prediction.risk_factors.map((factor: string, i: number) => (
                    <li key={i}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {prediction.recommendations && prediction.recommendations.length > 0 && (
              <div>
                <p className="font-medium mb-2">Recommendations:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {prediction.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <Button onClick={analyzePrediction} disabled={analyzing} className="w-full">
          {analyzing ? 'Analyzing...' : 'Analyze Readmission Risk'}
        </Button>
      </CardContent>
    </Card>
  );
}
