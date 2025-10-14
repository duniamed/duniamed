import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Building2, Users, DollarSign, Settings } from "lucide-react";

export default function MultiTenantOrganizationManagement() {
  const [loading, setLoading] = useState(false);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const { toast } = useToast();

  const handleReconcileBilling = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-tenant-billing-reconciliation', {
        body: {
          organizationId: 'org-id',
          billingPeriod: { start: '2025-01-01', end: '2025-01-31' }
        }
      });

      if (error) throw error;

      setReconciliation(data.reconciliation);
      toast({
        title: "Reconciliation Complete",
        description: `Total revenue: $${data.reconciliation.total_revenue}`
      });
    } catch (error: any) {
      toast({
        title: "Reconciliation Failed",
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
          <Building2 className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Organization Management</h2>
        </div>
        <Button onClick={handleReconcileBilling} disabled={loading}>
          Reconcile Billing
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Clinics</p>
              <p className="text-2xl font-bold">15</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">1,247</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <p className="text-2xl font-bold">$124,500</p>
            </div>
          </div>
        </Card>
      </div>

      {reconciliation && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Clinic Revenue Breakdown</h3>
          <div className="space-y-3">
            {reconciliation.clinic_breakdown?.map((clinic: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Clinic {idx + 1}</p>
                    <p className="text-sm text-muted-foreground">
                      Revenue: ${clinic.revenue?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${clinic.net?.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Net</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Organization Settings</h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="mr-2 h-5 w-5" />
            Configure Branding
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Users className="mr-2 h-5 w-5" />
            Manage User Roles
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <DollarSign className="mr-2 h-5 w-5" />
            Billing Preferences
          </Button>
        </div>
      </Card>
    </div>
  );
}
