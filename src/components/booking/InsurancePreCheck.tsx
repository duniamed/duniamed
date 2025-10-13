import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InsurancePreCheckProps {
  patientId: string;
  specialistId: string;
  onVerified: (data: InsuranceData) => void;
}

interface InsuranceData {
  status: 'active' | 'inactive' | 'pending';
  copay: number;
  deductible: {
    amount: number;
    met: number;
    remaining: number;
  };
  priorAuthRequired: boolean;
  estimatedCost: number;
}

export function InsurancePreCheck({ patientId, specialistId, onVerified }: InsurancePreCheckProps) {
  const [loading, setLoading] = useState(true);
  const [insuranceData, setInsuranceData] = useState<InsuranceData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    verifyInsurance();
  }, [patientId, specialistId]);

  const verifyInsurance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-insurance-eligibility', {
        body: {
          patientId,
          specialistId,
        },
      });

      if (error) throw error;

      if (data) {
        setInsuranceData(data);
        onVerified(data);
      }
    } catch (error: any) {
      toast({
        title: 'Insurance Check Failed',
        description: error.message || 'Unable to verify insurance at this time',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Checking insurance coverage...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insuranceData) {
    return (
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            Insurance Verification Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            We couldn't verify your insurance coverage. You can still book, but you'll be responsible for the full payment.
          </p>
          <Button variant="outline" onClick={verifyInsurance}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={
      insuranceData.status === 'active' 
        ? 'border-green-500/50 bg-green-500/5' 
        : 'border-red-500/50 bg-red-500/5'
    }>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Insurance Verification
        </CardTitle>
        <CardDescription>Real-time eligibility check completed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge className={
            insuranceData.status === 'active' ? 'bg-green-500' : 'bg-red-500'
          }>
            {insuranceData.status === 'active' ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                ACTIVE
              </>
            ) : (
              <>
                <AlertTriangle className="mr-1 h-3 w-3" />
                {insuranceData.status.toUpperCase()}
              </>
            )}
          </Badge>
        </div>

        {insuranceData.status === 'active' && (
          <>
            <div className="space-y-2 pt-2 border-t">
              <h4 className="font-semibold text-sm">Estimated Costs</h4>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Consultation Fee</span>
                  <span className="font-medium">${insuranceData.estimatedCost}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Co-pay</span>
                  <span className="font-semibold text-lg text-primary">
                    ${insuranceData.copay}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Insurance Covers</span>
                  <span className="font-medium text-green-600">
                    ${insuranceData.estimatedCost - insuranceData.copay}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <h4 className="font-semibold text-sm">Deductible Status</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Annual Deductible</span>
                  <span>${insuranceData.deductible.amount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount Met</span>
                  <span className="text-green-600">${insuranceData.deductible.met}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span>${insuranceData.deductible.remaining}</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(insuranceData.deductible.met / insuranceData.deductible.amount) * 100}%` 
                  }}
                />
              </div>
            </div>

            {insuranceData.priorAuthRequired && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-600">Prior Authorization Required</p>
                  <p className="text-muted-foreground">
                    Your insurance requires pre-approval for this consultation.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">
                Coverage verified as of {new Date().toLocaleTimeString()}
              </span>
            </div>
          </>
        )}

        {insuranceData.status !== 'active' && (
          <div className="pt-2">
            <p className="text-sm text-red-600 font-medium mb-2">
              Your insurance appears inactive or not found.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              You can still book, but you'll be responsible for full payment.
            </p>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Estimated Full Cost</span>
              <span className="text-lg font-semibold">
                <DollarSign className="inline h-4 w-4" />
                {insuranceData.estimatedCost}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}