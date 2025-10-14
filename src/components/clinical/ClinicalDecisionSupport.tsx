import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Stethoscope, AlertTriangle, FileText, Pill } from 'lucide-react';

export const ClinicalDecisionSupport: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [support, setSupport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getDecisionSupport = async (symptoms: string[], vitals: any) => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('clinical-decision-support', {
        body: {
          patientId,
          symptoms,
          vitals,
          context: { encounter_type: 'consultation' }
        }
      });
      setSupport(data.decision_support);
    } catch (error) {
      console.error('Decision support error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!support) return null;

  return (
    <div className="space-y-4">
      {support.alerts?.map((alert: any, idx: number) => (
        <Alert key={idx} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Differential Diagnosis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {support.differential_diagnosis?.map((dx: any, idx: number) => (
              <Card key={idx}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold">{dx.condition}</div>
                      <div className="text-sm text-muted-foreground">
                        {dx.supporting_evidence.join(', ')}
                      </div>
                      <div className="flex gap-1">
                        {dx.icd10_codes.map((code: string) => (
                          <Badge key={code} variant="outline">{code}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {(dx.probability * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Probability</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recommended Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {support.recommended_tests?.map((test: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{test.test}</div>
                  <div className="text-sm text-muted-foreground">{test.rationale}</div>
                </div>
                <Badge variant={test.urgency === 'stat' ? 'destructive' : 'secondary'}>
                  {test.urgency}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {support.drug_interactions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Drug Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {support.drug_interactions.map((interaction: any, idx: number) => (
                <Alert key={idx} variant={interaction.severity === 'severe' ? 'destructive' : 'default'}>
                  <AlertDescription>
                    <div className="font-medium">{interaction.drugs.join(' + ')}</div>
                    <div className="text-sm">{interaction.recommendation}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
