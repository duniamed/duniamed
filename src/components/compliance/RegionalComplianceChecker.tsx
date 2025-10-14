import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Shield, AlertTriangle } from 'lucide-react';

export default function RegionalComplianceChecker() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState('');
  const [report, setReport] = useState<any>(null);

  const regions = [
    { value: 'US', label: 'United States (HIPAA)' },
    { value: 'EU', label: 'European Union (GDPR)' },
    { value: 'UK', label: 'United Kingdom (UK GDPR)' },
    { value: 'CA', label: 'Canada (PIPEDA)' },
    { value: 'BR', label: 'Brazil (LGPD)' },
    { value: 'AU', label: 'Australia (Privacy Act)' }
  ];

  const handleCheckCompliance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('regional-compliance-check', {
        body: {
          region,
          operation_type: 'telemedicine',
          data_handling: {
            stores_pii: true,
            stores_phi: true,
            cross_border_transfer: false
          }
        }
      });

      if (error) throw error;

      setReport(data.compliance_report);
      toast({
        title: "Compliance Check Complete",
        description: `Status: ${data.compliance_report.compliant ? 'Compliant' : 'Issues Found'}`,
        variant: data.compliance_report.compliant ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Compliance Check Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Regional Compliance Checker</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Region</label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleCheckCompliance} disabled={loading || !region}>
            Check Compliance
          </Button>
        </div>
      </Card>

      {report && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {report.compliant ? (
                <Shield className="h-5 w-5 text-success" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
              <h4 className="font-medium">Compliance Status</h4>
            </div>
            <Badge variant={report.compliant ? "default" : "destructive"}>
              {report.compliant ? 'Compliant' : 'Non-Compliant'}
            </Badge>
          </div>

          <div>
            <h4 className="font-medium mb-2">Applicable Regulations</h4>
            <div className="flex flex-wrap gap-2">
              {report.regulations?.map((reg: string, idx: number) => (
                <Badge key={idx} variant="outline">{reg}</Badge>
              ))}
            </div>
          </div>

          {report.violations?.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Potential Violations</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {report.violations.map((violation: string, idx: number) => (
                  <li key={idx}>{violation}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Requirements</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {report.requirements?.map((req: string, idx: number) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>

          {report.recommendations?.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {report.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {report.data_residency && (
            <div className="p-3 bg-secondary rounded">
              <h4 className="font-medium mb-1">Data Residency</h4>
              <p className="text-sm text-muted-foreground">{report.data_residency}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
