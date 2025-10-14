import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { FileText, CheckCircle, XCircle } from "lucide-react";

export default function ClinicalTrialEnrollment() {
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  const { toast } = useToast();

  const handleCheckEligibility = async (trialId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clinical-trial-enrollment', {
        body: {
          patientId: 'current-user-id',
          trialId,
          patientData: { age: 45, conditions: [] }
        }
      });

      if (error) throw error;

      setEligibility(data.eligibilityCheck);
      toast({
        title: data.eligibilityCheck.eligible ? "Eligible for Trial" : "Not Eligible",
        description: `Eligibility score: ${data.eligibilityCheck.eligibility_score}%`
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-bold">Clinical Trial Enrollment</h2>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Available Clinical Trials</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Diabetes Management Study</h4>
              <p className="text-sm text-muted-foreground">Phase III trial for new diabetes treatment</p>
            </div>
            <Button onClick={() => handleCheckEligibility('trial-1')} disabled={loading}>
              Check Eligibility
            </Button>
          </div>
        </div>
      </Card>

      {eligibility && (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            {eligibility.eligible ? (
              <CheckCircle className="h-6 w-6 text-success" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive" />
            )}
            <div>
              <h4 className="font-semibold mb-2">Eligibility Results</h4>
              <p className="text-sm mb-4">{eligibility.enrollment_recommendation}</p>
              {eligibility.criteria_met.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-success">Criteria Met:</p>
                  <ul className="text-sm list-disc list-inside">
                    {eligibility.criteria_met.map((criteria: string, idx: number) => (
                      <li key={idx}>{criteria}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
