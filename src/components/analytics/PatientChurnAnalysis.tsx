import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserX, AlertTriangle, TrendingDown, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PatientChurnAnalysisProps {
  clinicId: string;
}

export function PatientChurnAnalysis({ clinicId }: PatientChurnAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const analyzeChurn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-churn-prediction', {
        body: { clinicId }
      });

      if (error) throw error;

      setAnalysis(data.churnAnalysis);
      toast({
        title: 'Churn Analysis Complete',
        description: `Analyzed ${data.patients_analyzed} patients`,
      });
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    const variants: Record<string, any> = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    };
    return variants[level] || 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserX className="h-5 w-5" />
          Patient Churn Prediction
        </CardTitle>
        <CardDescription>ML-powered retention analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={analyzeChurn} disabled={loading} className="w-full">
          {loading ? 'Analyzing...' : 'Analyze Patient Churn Risk'}
        </Button>

        {analysis && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Patients Analyzed</div>
                <div className="text-2xl font-bold">
                  {analysis.churn_statistics.total_patients_analyzed}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">High Risk</div>
                <div className="text-2xl font-bold text-red-600">
                  {analysis.churn_statistics.high_risk_count}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Predicted Churn Rate</div>
                <div className="text-2xl font-bold text-orange-600">
                  {analysis.churn_statistics.predicted_monthly_churn_rate.toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Medium Risk</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {analysis.churn_statistics.medium_risk_count}
                </div>
              </div>
            </div>

            {analysis.high_risk_patients && analysis.high_risk_patients.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  High-Risk Patients
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analysis.high_risk_patients.slice(0, 10).map((patient: any) => (
                    <div key={patient.patient_id} className="p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getRiskBadge(patient.risk_level)}>
                          {patient.risk_level}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {patient.days_since_last_visit} days inactive
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Churn Probability: </span>
                          <span className="font-medium text-red-600">
                            {(patient.churn_probability * 100).toFixed(1)}%
                          </span>
                        </div>
                        {patient.key_indicators && patient.key_indicators.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Indicators: {patient.key_indicators.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.retention_strategies && (
              <div>
                <h4 className="font-medium mb-2">Retention Strategies</h4>
                <div className="space-y-2">
                  {analysis.retention_strategies.map((strategy: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-primary/5 rounded-md">
                      <Target className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium">{strategy.strategy}</div>
                        <div className="text-muted-foreground text-xs">
                          Target: {strategy.target_segment} • Impact: {strategy.expected_impact}%
                        </div>
                      </div>
                      <Badge variant="outline">{strategy.implementation_priority}</Badge>
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
