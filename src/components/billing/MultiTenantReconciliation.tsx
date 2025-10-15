import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MultiTenantReconciliationProps {
  clinicIds: string[];
  startDate: string;
  endDate: string;
}

export function MultiTenantReconciliation({ clinicIds, startDate, endDate }: MultiTenantReconciliationProps) {
  const [loading, setLoading] = useState(false);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const { toast } = useToast();

  const runReconciliation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-tenant-billing-reconciliation', {
        body: { clinicIds, startDate, endDate }
      });

      if (error) throw error;

      setReconciliation(data.reconciliation);
      toast({
        title: 'Reconciliation Complete',
        description: `Processed ${data.processed_records} billing records`,
      });
    } catch (error: any) {
      toast({
        title: 'Reconciliation Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Multi-Tenant Billing Reconciliation
        </CardTitle>
        <CardDescription>AI-powered cross-clinic billing analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runReconciliation} disabled={loading} className="w-full">
          {loading ? 'Analyzing...' : 'Run Reconciliation'}
        </Button>

        {reconciliation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold">
                  ${reconciliation.reconciliation_summary.total_revenue.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Outstanding</div>
                <div className="text-2xl font-bold text-orange-600">
                  ${reconciliation.reconciliation_summary.total_outstanding.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Discrepancies</div>
                <div className="text-2xl font-bold text-red-600">
                  {reconciliation.reconciliation_summary.discrepancies_found}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Reconciliation Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {reconciliation.reconciliation_summary.reconciliation_rate}%
                </div>
              </div>
            </div>

            {reconciliation.clinic_breakdowns && (
              <div>
                <h4 className="font-medium mb-3">Clinic Breakdowns</h4>
                <div className="space-y-3">
                  {reconciliation.clinic_breakdowns.map((clinic: any) => (
                    <div key={clinic.clinic_id} className="p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{clinic.clinic_name}</span>
                        <Badge variant="outline">${clinic.revenue.toLocaleString()}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Paid: </span>
                          <span className="text-green-600">${clinic.paid.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pending: </span>
                          <span className="text-orange-600">${clinic.pending.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Outstanding: </span>
                          <span className="text-red-600">${clinic.outstanding.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reconciliation.anomalies_detected && reconciliation.anomalies_detected.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Anomalies Detected
                </h4>
                <div className="space-y-2">
                  {reconciliation.anomalies_detected.map((anomaly: any, idx: number) => (
                    <div key={idx} className="p-2 bg-orange-50 dark:bg-orange-950 rounded-md text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{anomaly.type}</span>
                        <Badge variant={
                          anomaly.severity === 'high' ? 'destructive' :
                          anomaly.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground mt-1">{anomaly.description}</div>
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
