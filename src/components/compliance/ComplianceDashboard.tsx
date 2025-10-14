import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, FileText, Lock, AlertTriangle } from 'lucide-react';

export const ComplianceDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);
  const { toast } = useToast();

  const runHIPAAAudit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('hipaa-audit-trail', {
        body: { 
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      });
      
      if (error) throw error;
      setAuditData(data);
      toast({ title: 'Audit complete', description: 'HIPAA compliance report generated' });
    } catch (error: any) {
      toast({ title: 'Audit failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const checkPHIAccess = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('phi-access-control', {
        body: { action: 'verify_access_logs' }
      });
      
      if (error) throw error;
      toast({ title: 'Access verified', description: 'PHI access controls validated' });
    } catch (error: any) {
      toast({ title: 'Verification failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            HIPAA Compliance
          </CardTitle>
          <CardDescription>Automated compliance monitoring and auditing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={runHIPAAAudit} disabled={loading}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Audit
            </Button>
            <Button onClick={checkPHIAccess} disabled={loading} variant="outline">
              <Lock className="mr-2 h-4 w-4" />
              Verify PHI Access
            </Button>
          </div>

          {auditData && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Total Access Events</span>
                <Badge>{auditData.total_events}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Compliance Score</span>
                <Badge variant={auditData.compliance_score > 95 ? 'default' : 'destructive'}>
                  {auditData.compliance_score}%
                </Badge>
              </div>
              {auditData.violations?.length > 0 && (
                <div className="p-3 border border-destructive rounded-lg">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold">Violations Detected</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {auditData.violations.map((v: string, i: number) => (
                      <li key={i}>• {v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
