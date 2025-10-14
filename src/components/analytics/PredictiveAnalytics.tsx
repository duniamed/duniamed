import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LineChart, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const PredictiveAnalytics = ({ patientId }: { patientId: string }) => {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzReadmissionRisk = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-readmission', {
        body: {
          patientId,
          dischargeDate: new Date().toISOString()
        }
      });
      
      if (error) throw error;
      setPrediction(data.prediction);
      toast({ title: 'Analysis complete' });
    } catch (error: any) {
      toast({ title: 'Analysis failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'default';
    if (score < 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predictive Analytics</CardTitle>
        <CardDescription>AI-powered readmission risk assessment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={analyzReadmissionRisk} disabled={loading} className="w-full">
          <LineChart className="mr-2 h-4 w-4" />
          {loading ? 'Analyzing...' : 'Analyze Readmission Risk'}
        </Button>

        {prediction && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Risk Score</span>
              <Badge variant={getRiskColor(prediction.risk_score)}>
                {prediction.risk_score}%
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Risk Factors</span>
              </div>
              <ul className="space-y-1">
                {prediction.risk_factors?.map((factor: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground ml-6">• {factor}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Recommendations</span>
              </div>
              <ul className="space-y-1">
                {prediction.recommendations?.map((rec: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground ml-6">• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
