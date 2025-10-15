import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface RPMComplianceTrackerProps {
  patientId: string;
}

export const RPMComplianceTracker = ({ patientId }: RPMComplianceTrackerProps) => {
  const [loading, setLoading] = useState(false);
  const [compliance, setCompliance] = useState<any>(null);
  const { toast } = useToast();

  const checkCompliance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rpm-compliance-tracking', {
        body: { 
          patientId,
          deviceReadings: [],
          billingPeriod: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      setCompliance(data.compliance);
      toast({
        title: compliance?.compliant ? "Compliant" : "Non-Compliant",
        description: `${data.compliance.readingDays} days of readings recorded`
      });
    } catch (error: any) {
      toast({
        title: "Check Failed",
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
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">RPM Compliance Tracker</h3>
        </div>
        <Button onClick={checkCompliance} disabled={loading}>
          {loading ? 'Checking...' : 'Check Compliance'}
        </Button>
      </div>

      {compliance && (
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            {compliance.compliant ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-medium">
              {compliance.compliant ? 'Medicare Compliant' : 'Non-Compliant'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="p-3">
              <p className="text-sm text-muted-foreground">Reading Days</p>
              <p className="text-2xl font-bold">{compliance.readingDays}</p>
            </Card>
            <Card className="p-3">
              <p className="text-sm text-muted-foreground">Transmission Min</p>
              <p className="text-2xl font-bold">{compliance.transmissionMinutes}</p>
            </Card>
            <Card className="p-3">
              <p className="text-sm text-muted-foreground">Review Min</p>
              <p className="text-2xl font-bold">{compliance.reviewMinutes}</p>
            </Card>
          </div>

          {compliance.cptCodes?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Billable CPT Codes</p>
              <div className="flex flex-wrap gap-2">
                {compliance.cptCodes.map((code: string) => (
                  <Badge key={code}>{code}</Badge>
                ))}
              </div>
            </div>
          )}

          {compliance.billingRecommendations?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Billing Recommendations</p>
              <ul className="space-y-1">
                {compliance.billingRecommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {compliance.gaps?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-yellow-600">Compliance Gaps</p>
              <ul className="space-y-1">
                {compliance.gaps.map((gap: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">• {gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
