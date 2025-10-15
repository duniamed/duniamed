import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, XCircle, AlertCircle, DollarSign } from 'lucide-react';

export const RealtimeInsuranceVerification = () => {
  const [verification, setVerification] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const verifyInsurance = async () => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-insurance-realtime', {
        body: {
          patientId: 'patient-id',
          insuranceData: {},
          procedureCode: 'CPT-12345'
        }
      });

      if (error) throw error;

      setVerification(data.verification);
      toast({
        title: 'Verification complete',
        description: `Status: ${data.verification.verification_status}`
      });
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = () => {
    if (!verification) return <Shield className="h-5 w-5" />;
    switch (verification.verification_status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    if (!verification) return null;
    const status = verification.verification_status;
    const variant = status === 'verified' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              Real-time Insurance Verification
            </div>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={verifyInsurance} disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Verify Insurance'}
          </Button>

          {verification && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Coverage Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Coverage Active</span>
                    <Badge variant={verification.coverage_active ? 'default' : 'destructive'}>
                      {verification.coverage_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {verification.coverage_details && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Coverage Percentage</span>
                        <span className="font-medium">{verification.coverage_details.coverage_percentage}%</span>
                      </div>
                      <Progress value={verification.coverage_details.coverage_percentage} />

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Copay Amount</p>
                          <p className="text-lg font-semibold">${verification.coverage_details.copay_amount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Deductible Remaining</p>
                          <p className="text-lg font-semibold">${verification.coverage_details.deductible_remaining}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Out-of-Pocket Max</p>
                          <p className="text-lg font-semibold">${verification.coverage_details.out_of_pocket_max}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Prior Auth Required</p>
                          <Badge variant={verification.coverage_details.prior_auth_required ? 'destructive' : 'default'}>
                            {verification.coverage_details.prior_auth_required ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {verification.procedure_coverage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Procedure Coverage Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Allowed Amount</p>
                        <p className="text-xl font-bold">${verification.procedure_coverage.allowed_amount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Insurance Pays</p>
                        <p className="text-xl font-bold text-green-600">${verification.procedure_coverage.insurance_pays}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Patient Responsibility</p>
                        <p className="text-2xl font-bold text-orange-600">${verification.procedure_coverage.patient_responsibility}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {verification.warnings?.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100">Warnings</p>
                      <ul className="list-disc list-inside text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                        {verification.warnings.map((warning: string, idx: number) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Verification Code: {verification.verification_code} | 
                Verified: {new Date(verification.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
