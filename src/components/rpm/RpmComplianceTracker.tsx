import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, FileCheck } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const RpmComplianceTracker = () => {
  const [checking, setChecking] = useState(false);
  const [compliance, setCompliance] = useState<any>(null);
  const { toast } = useToast();

  const checkCompliance = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('rpm-compliance-tracking', {
        body: { patient_id: 'pat_123' }
      });

      if (error) throw error;

      setCompliance(data.compliance);
      toast({
        title: "Compliance Check Complete",
        description: `Potential revenue: $${data.compliance.total_potential_revenue}`
      });
    } catch (error: any) {
      toast({
        title: "Check Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">RPM Billing Compliance</h3>
        </div>
        <Button onClick={checkCompliance} disabled={checking}>
          <DollarSign className="h-4 w-4 mr-2" />
          Check Billing Status
        </Button>
      </div>
      {compliance && (
        <div className="space-y-2 text-sm">
          <div>CPT 99454: {compliance.cpt_99454_eligible ? '✅' : '❌'} ({compliance.cpt_99454_days} days)</div>
          <div>CPT 99457: {compliance.cpt_99457_eligible ? '✅' : '❌'} ({compliance.cpt_99457_minutes} min)</div>
          <div className="font-bold mt-4">Revenue: ${compliance.total_potential_revenue}</div>
        </div>
      )}
    </Card>
  );
};
