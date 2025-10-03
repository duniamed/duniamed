import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Check } from 'lucide-react';

/**
 * C16 PRICING - Subscription Checkout with Stripe
 * Handles subscription creation and payment processing
 */

interface SubscriptionCheckoutProps {
  tierId: string;
  tierName: string;
  price: number;
  billingPeriod: 'monthly' | 'annual';
  features: string[];
  onSuccess?: () => void;
}

export function SubscriptionCheckout({
  tierId,
  tierName,
  price,
  billingPeriod,
  features,
  onSuccess
}: SubscriptionCheckoutProps) {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to subscribe",
          variant: "destructive",
        });
        return;
      }

      // Create payment session via edge function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          type: 'subscription',
          tier_id: tierId,
          billing_period: billingPeriod,
          success_url: `${window.location.origin}/subscription-plans?success=true`,
          cancel_url: `${window.location.origin}/subscription-plans?cancelled=true`
        }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: "Unable to process subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{tierName}</CardTitle>
            <CardDescription>
              ${price}/{billingPeriod === 'monthly' ? 'month' : 'year'}
            </CardDescription>
          </div>
          {billingPeriod === 'annual' && (
            <Badge variant="secondary">Save 20%</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Included Features:</p>
          <ul className="space-y-2">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={handleSubscribe}
          disabled={processing}
          className="w-full"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          {processing ? 'Processing...' : 'Subscribe Now'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Secure payment powered by Stripe • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}
