import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

interface InsuranceVerificationProps {
  patientId: string;
  appointmentId?: string;
}

export const InsuranceVerification: React.FC<InsuranceVerificationProps> = ({
  patientId,
  appointmentId
}) => {
  const [insuranceData, setInsuranceData] = useState({
    provider: '',
    member_id: '',
    group_number: ''
  });
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('verify-insurance-realtime', {
        body: {
          patientId,
          appointmentId,
          insuranceInfo: insuranceData
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      toast({
        title: data.verified ? "Insurance Verified" : "Verification Failed",
        description: data.message,
        variant: data.verified ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Real-Time Insurance Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!verificationResult ? (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider">Insurance Provider</Label>
                <Input
                  id="provider"
                  placeholder="e.g., Blue Cross Blue Shield"
                  value={insuranceData.provider}
                  onChange={(e) =>
                    setInsuranceData({ ...insuranceData, provider: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="member_id">Member ID</Label>
                <Input
                  id="member_id"
                  placeholder="Member/Policy Number"
                  value={insuranceData.member_id}
                  onChange={(e) =>
                    setInsuranceData({ ...insuranceData, member_id: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="group_number">Group Number (Optional)</Label>
                <Input
                  id="group_number"
                  placeholder="Group Number"
                  value={insuranceData.group_number}
                  onChange={(e) =>
                    setInsuranceData({ ...insuranceData, group_number: e.target.value })
                  }
                />
              </div>
            </div>

            <Button
              onClick={() => verifyMutation.mutate()}
              disabled={
                !insuranceData.provider ||
                !insuranceData.member_id ||
                verifyMutation.isPending
              }
              className="w-full"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Insurance'
              )}
            </Button>
          </>
        ) : (
          <>
            <div
              className={`flex items-center gap-3 p-4 rounded-lg ${
                verificationResult.verified
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {verificationResult.verified ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <p
                  className={`font-semibold ${
                    verificationResult.verified ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {verificationResult.verified ? 'Insurance Verified' : 'Verification Failed'}
                </p>
                <p
                  className={`text-sm ${
                    verificationResult.verified ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {verificationResult.message}
                </p>
              </div>
            </div>

            {verificationResult.verified && verificationResult.coverage && (
              <div className="space-y-3">
                <h4 className="font-semibold">Coverage Details:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Copay</p>
                    <p className="font-semibold">
                      ${verificationResult.coverage.copay || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deductible Met</p>
                    <p className="font-semibold">
                      ${verificationResult.coverage.deductible_met || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Out-of-Pocket Max</p>
                    <p className="font-semibold">
                      ${verificationResult.coverage.out_of_pocket_max || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold text-green-600">Active</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => setVerificationResult(null)}
              variant="outline"
              className="w-full"
            >
              Verify Another Policy
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
