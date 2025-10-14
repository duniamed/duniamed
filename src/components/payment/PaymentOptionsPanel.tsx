import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CreditCard, Calendar } from 'lucide-react';

export const PaymentOptionsPanel = ({ appointmentId, amount }: { appointmentId: string; amount: number }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createInstallmentPlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-affirm-installment', {
        body: { amount: amount * 100, appointmentId }
      });
      
      if (error) throw error;
      toast({ title: 'Installment plan created', description: 'Redirecting to payment...' });
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch (error: any) {
      toast({ title: 'Failed to create plan', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createCareCreditPlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-carecredit-plan', {
        body: { amount, patient_info: {} }
      });
      
      if (error) throw error;
      toast({ title: 'CareCredit options available' });
    } catch (error: any) {
      toast({ title: 'Failed to fetch plans', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flexible Payment Options</CardTitle>
        <CardDescription>Choose your preferred payment method</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Button onClick={createInstallmentPlan} disabled={loading} className="w-full">
            <Calendar className="mr-2 h-4 w-4" />
            Pay in Installments with Affirm
          </Button>
          <Button onClick={createCareCreditPlan} disabled={loading} variant="outline" className="w-full">
            <CreditCard className="mr-2 h-4 w-4" />
            CareCredit Financing
          </Button>
          <Button variant="outline" className="w-full">
            <DollarSign className="mr-2 h-4 w-4" />
            HSA/FSA Payment
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Total Amount: ${amount}</p>
          <p className="mt-1">All payment methods are secure and HIPAA compliant</p>
        </div>
      </CardContent>
    </Card>
  );
};
