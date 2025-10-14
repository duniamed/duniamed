import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InsuranceVerificationProps {
  patientId: string;
  appointmentId: string;
}

const InsuranceVerification = ({ patientId, appointmentId }: InsuranceVerificationProps) => {
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<any>(null);
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [provider, setProvider] = useState('');
  const { toast } = useToast();

  const verifyInsurance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('insurance-verification', {
        body: { 
          patientId,
          appointmentId,
          insuranceDetails: {
            policy_number: insuranceNumber,
            provider: provider,
            patient_id: patientId
          }
        }
      });

      if (error) throw error;

      setVerification(data.verification);
      toast({
        title: "Insurance verified",
        description: data.verification.verified ? "Coverage confirmed" : "Verification failed",
      });
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Insurance Verification
        </CardTitle>
        <CardDescription>Verify insurance coverage for this appointment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Insurance Provider</Label>
          <Input 
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g., Blue Cross Blue Shield"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Policy Number</Label>
          <Input 
            value={insuranceNumber}
            onChange={(e) => setInsuranceNumber(e.target.value)}
            placeholder="Enter policy number"
          />
        </div>

        <Button 
          onClick={verifyInsurance} 
          disabled={loading || !insuranceNumber || !provider}
          className="w-full"
        >
          {loading ? 'Verifying...' : 'Verify Coverage'}
        </Button>

        {verification && (
          <div className="mt-4 p-4 border rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              {verification.verified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-semibold">
                {verification.verified ? 'Coverage Confirmed' : 'Not Covered'}
              </span>
            </div>
            
            {verification.verified && (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Coverage: {verification.coverage_percentage}%</div>
                  <div>Copay: ${verification.copay_amount}</div>
                  <div>Deductible: ${verification.deductible_remaining}</div>
                  <div>OOP Max: ${verification.out_of_pocket_max}</div>
                </div>
                
                {verification.pre_auth_required && (
                  <p className="text-sm text-amber-600">⚠️ Pre-authorization required</p>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsuranceVerification;
