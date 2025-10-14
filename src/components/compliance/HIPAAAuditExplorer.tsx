import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Shield, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function HIPAAAuditExplorer() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const { toast } = useToast();

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('hipaa-compliance-validator', {
        body: {
          organizationId: 'org-id',
          auditScope: 'full'
        }
      });

      if (error) throw error;

      setReport(data.complianceReport);
      toast({
        title: "Audit Complete",
        description: `Compliance score: ${data.complianceReport.compliance_score}%`,
        variant: data.complianceReport.certification_ready ? 'default' : 'destructive'
      });
    } catch (error: any) {
      toast({
        title: "Audit Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">HIPAA Compliance Audit</h2>
        </div>
        <Button onClick={handleRunAudit} disabled={loading}>
          {loading ? 'Running Audit...' : 'Run Compliance Audit'}
        </Button>
      </div>

      {report && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Compliance Score</p>
                  <p className="text-2xl font-bold">{report.compliance_score}%</p>
                </div>
              </div>
              <Progress value={report.compliance_score} className="mt-4" />
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Violations</p>
                  <p className="text-2xl font-bold">{report.violations.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Compliant Areas</p>
                  <p className="text-2xl font-bold">{report.compliant_areas.length}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Compliance Violations</h3>
            <div className="space-y-4">
              {report.violations.map((violation: any, idx: number) => (
                <div key={idx} className="p-4 border rounded-lg border-warning">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm mb-1">
                        {violation.severity.toUpperCase()} Severity
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">{violation.description}</p>
                      <p className="text-sm font-medium">Recommendation: {violation.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
