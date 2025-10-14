import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Activity, TrendingUp } from 'lucide-react';

interface RiskAssessment {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  risk_factors: Array<{
    factor: string;
    severity: string;
    evidence: string;
  }>;
  readmission_risk: number;
  hospitalization_risk: number;
  care_recommendations: string[];
  monitoring_frequency: string;
}

export const PatientRiskDashboard: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);

  const assessRisk = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('patient-risk-stratification', {
        body: { patientId }
      });
      setAssessment(data.stratification);
    } catch (error) {
      console.error('Risk assessment error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    assessRisk();
  }, [patientId]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success';
      case 'medium': return 'bg-warning';
      case 'high': return 'bg-destructive';
      case 'critical': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading risk assessment...</div>;
  }

  if (!assessment) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Patient Risk Stratification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Overall Risk Level</div>
              <Badge className={getRiskColor(assessment.risk_level)}>
                {assessment.risk_level.toUpperCase()}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{assessment.risk_score}</div>
              <div className="text-sm text-muted-foreground">Risk Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-destructive" />
                  <div>
                    <div className="text-2xl font-bold">
                      {(assessment.readmission_risk * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Readmission Risk</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-warning" />
                  <div>
                    <div className="text-2xl font-bold">
                      {(assessment.hospitalization_risk * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Hospitalization Risk</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {assessment.risk_factors.length > 0 && (
            <div className="space-y-2">
              <div className="font-semibold">Risk Factors</div>
              <div className="space-y-2">
                {assessment.risk_factors.map((factor, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{factor.factor}</div>
                          <div className="text-sm text-muted-foreground">{factor.evidence}</div>
                        </div>
                        <Badge variant="outline">{factor.severity}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {assessment.care_recommendations.length > 0 && (
            <div className="space-y-2">
              <div className="font-semibold">Care Recommendations</div>
              <ul className="list-disc list-inside space-y-1">
                {assessment.care_recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Monitoring Frequency</span>
            <Badge>{assessment.monitoring_frequency}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
