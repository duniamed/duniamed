import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function ComplianceTracker() {
  const [checking, setChecking] = useState(false);
  const [compliance, setCompliance] = useState<any>(null);
  const { toast } = useToast();

  const checkCompliance = async () => {
    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const currentMonth = new Date().toISOString().slice(0, 7);

      const { data, error } = await supabase.functions.invoke('rpm-compliance-tracking', {
        body: { patientId: user.id, billingPeriod: currentMonth }
      });

      if (error) throw error;

      setCompliance(data.compliance);
      toast({
        title: data.compliance.is_compliant ? "Compliance Met" : "Action Required",
        description: data.compliance.is_compliant 
          ? `${data.compliance.days_with_readings} days tracked - eligible for CPT-99454`
          : `${data.compliance.days_with_readings}/16 days - continue tracking`
      });
    } catch (error: any) {
      toast({ title: "Check Failed", description: error.message, variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {compliance?.is_compliant ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          )}
          RPM Compliance Tracker
        </CardTitle>
        <CardDescription>Monitor CMS billing compliance for remote patient monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {compliance && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Days with readings</span>
                <span className="font-medium">{compliance.days_with_readings}/16</span>
              </div>
              <Progress value={compliance.compliance_percentage} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Readings</p>
                <p className="text-lg font-semibold">{compliance.total_readings}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Billing Code</p>
                <p className="text-lg font-semibold">{compliance.billing_code || 'N/A'}</p>
              </div>
            </div>
          </>
        )}

        <Button onClick={checkCompliance} disabled={checking} className="w-full">
          {checking ? 'Checking...' : 'Check Compliance Status'}
        </Button>
      </CardContent>
    </Card>
  );
}
