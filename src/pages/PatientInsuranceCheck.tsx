import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PatientInsuranceCheck() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    payer_id: '',
    member_id: '',
  });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-eligibility', {
        body: {
          payer_id: formData.payer_id,
          member_id: formData.member_id,
          patient_id: user?.id,
        }
      });

      if (error) throw error;
      
      setResult(data);
      
      toast({
        title: 'Verification Complete',
        description: data.is_eligible ? 'Insurance is valid' : 'Insurance verification failed',
      });
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify insurance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Insurance Eligibility Check</h1>
            <p className="text-muted-foreground">Verify your insurance coverage before booking</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Check Your Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payer_id">Insurance Payer ID</Label>
                <Input
                  id="payer_id"
                  required
                  placeholder="e.g., 12345"
                  value={formData.payer_id}
                  onChange={(e) => setFormData({ ...formData, payer_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member_id">Member ID</Label>
                <Input
                  id="member_id"
                  required
                  placeholder="Your insurance member ID"
                  value={formData.member_id}
                  onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Verifying...' : 'Check Eligibility'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Verification Result</CardTitle>
                {result.is_eligible ? (
                  <Badge className="gap-1"><CheckCircle className="h-4 w-4" /> Eligible</Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1"><XCircle className="h-4 w-4" /> Not Eligible</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.is_eligible && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Copay Amount</p>
                      <p className="text-lg font-semibold">${result.copay_amount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deductible Remaining</p>
                      <p className="text-lg font-semibold">${result.deductible_remaining || 0}</p>
                    </div>
                  </div>
                  {result.coverage_details && (
                    <div>
                      <p className="text-sm font-medium mb-2">Coverage Details</p>
                      <pre className="text-xs bg-muted p-3 rounded">
                        {JSON.stringify(result.coverage_details, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
