import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

interface InstallmentPlanSelectorProps {
  appointmentId: string;
  totalAmount: number;
  onSuccess: () => void;
}

export const InstallmentPlanSelector: React.FC<InstallmentPlanSelectorProps> = ({
  appointmentId,
  totalAmount,
  onSuccess
}) => {
  const [provider, setProvider] = useState<'affirm' | 'carecredit'>('carecredit');
  const [termMonths, setTermMonths] = useState(6);
  const [downPayment, setDownPayment] = useState(0);
  const { toast } = useToast();

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-installment-plan', {
        body: {
          appointmentId,
          totalAmount,
          downPayment,
          termMonths,
          provider
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Installment Plan Created",
        description: `Your ${termMonths}-month plan is ${data.plan.status}`,
      });
      if (data.plan.status === 'active') {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Plan Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const monthlyPayment = (totalAmount - downPayment) / termMonths;
  const interestRate = provider === 'carecredit' ? 0 : 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Plans Available
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Provider</Label>
            <Select
              value={provider}
              onValueChange={(value: any) => setProvider(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carecredit">CareCredit (0% APR)</SelectItem>
                <SelectItem value="affirm">Affirm (10% APR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Term Length</Label>
            <Select
              value={termMonths.toString()}
              onValueChange={(value) => setTermMonths(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 months</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="18">18 months</SelectItem>
                <SelectItem value="24">24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Down Payment (Optional)</Label>
            <Input
              type="number"
              min="0"
              max={totalAmount}
              value={downPayment}
              onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
              placeholder="$0"
            />
          </div>
        </div>

        <div className="p-4 bg-primary/10 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <p className="font-semibold">Payment Breakdown</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-semibold">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Down Payment:</span>
              <span className="font-semibold">${downPayment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Financed Amount:</span>
              <span className="font-semibold">
                ${(totalAmount - downPayment).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Monthly Payment:</span>
              <span className="font-bold text-primary">${monthlyPayment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Interest Rate:</span>
              <span>{interestRate}% APR</span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => createPlanMutation.mutate()}
          disabled={createPlanMutation.isPending}
          className="w-full"
        >
          {createPlanMutation.isPending
            ? 'Creating Plan...'
            : `Apply for ${termMonths}-Month Plan`}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          {provider === 'carecredit'
            ? 'Subject to CareCredit credit approval. 0% promotional financing available.'
            : 'Affirm financing subject to credit check. Representative APR 10-30%.'}
        </p>
      </CardContent>
    </Card>
  );
};
