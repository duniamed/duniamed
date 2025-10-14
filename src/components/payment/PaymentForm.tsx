import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface PaymentFormProps {
  appointmentId: string;
  amount: number;
  onSuccess: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ appointmentId, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [hsaFsaEligible, setHsaFsaEligible] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      // Create payment intent
      const { data: intentData, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          appointmentId,
          amount,
          hsaFsaEligible
        }
      });

      if (intentError) throw intentError;

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      );

      if (confirmError) throw confirmError;

      if (paymentIntent?.status === 'succeeded') {
        toast({
          title: "Payment Successful",
          description: `Payment of $${amount} processed successfully`,
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-md">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hsa-fsa"
              checked={hsaFsaEligible}
              onCheckedChange={(checked) => setHsaFsaEligible(checked as boolean)}
            />
            <Label htmlFor="hsa-fsa">Use HSA/FSA Card</Label>
          </div>

          <div className="text-lg font-semibold">
            Total: ${amount.toFixed(2)}
          </div>

          <Button type="submit" disabled={!stripe || processing} className="w-full">
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
