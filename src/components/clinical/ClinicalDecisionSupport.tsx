import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ClinicalDecisionSupportProps {
  patientId: string;
  clinicalData: any;
  context: string;
}

export const ClinicalDecisionSupport = ({ patientId, clinicalData, context }: ClinicalDecisionSupportProps) => {
  const [loading, setLoading] = useState(false);
  const [support, setSupport] = useState<any>(null);
  const { toast } = useToast();

  const getDecisionSupport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clinical-decision-support', {
        body: { patientId, clinicalData, context }
      });

      if (error) throw error;

      setSupport(data.decision_support);
      toast({
        title: "Decision Support Generated",
        description: `Confidence: ${(data.decision_support.confidence * 100).toFixed(0)}%`
      });
    } catch (error: any) {
      toast({
        title: "Support Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Clinical Decision Support</h3>
        </div>
        <Button onClick={getDecisionSupport} disabled={loading}>
          {loading ? 'Analyzing...' : 'Get Recommendations'}
        </Button>
      </div>

      {support && (
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Confidence Level</span>
            </div>
            <Badge>{(support.confidence * 100).toFixed(0)}%</Badge>
          </div>

          {support.evidence_level && (
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Evidence Level: {support.evidence_level}</span>
            </div>
          )}

          {support.primary_recommendations?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Primary Recommendations
              </p>
              <div className="space-y-2">
                {support.primary_recommendations.map((rec: string, index: number) => (
                  <Card key={index} className="p-3 bg-green-50 dark:bg-green-900/20">
                    <p className="text-sm">{rec}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {support.diagnostic_suggestions?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Diagnostic Suggestions</p>
              <ul className="space-y-1">
                {support.diagnostic_suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">🔬 {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {support.treatment_options?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Treatment Options</p>
              <div className="space-y-2">
                {support.treatment_options.map((option: any, index: number) => (
                  <Card key={index} className="p-3">
                    <p className="text-sm font-medium">{option.name || option}</p>
                    {option.description && (
                      <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {support.risk_alerts?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium text-red-600">Risk Alerts</p>
              </div>
              <div className="space-y-2">
                {support.risk_alerts.map((alert: string, index: number) => (
                  <Card key={index} className="p-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">⚠ {alert}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {support.drug_interactions?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-600">Drug Interactions</p>
              </div>
              <ul className="space-y-1">
                {support.drug_interactions.map((interaction: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">⚠ {interaction}</li>
                ))}
              </ul>
            </div>
          )}

          {support.references?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">References</p>
              <ul className="space-y-1">
                {support.references.map((ref: string, index: number) => (
                  <li key={index} className="text-xs text-muted-foreground">📚 {ref}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
