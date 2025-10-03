import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Check } from 'lucide-react';

/**
 * C16 PRICING - Stripe Subscription Checkout
 * Integration: Stripe (https://stripe.com)
 * You need to: 1. Create Stripe account at https://stripe.com
 *              2. Get your API keys from https://dashboard.stripe.com/apikeys
 *              3. Add STRIPE_SECRET_KEY_LOV secret in Supabase (already configured)
 *              4. Create products in Stripe dashboard
 */

interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  stripe_price_id_monthly?: string;
  stripe_price_id_annual?: string;
}

export function StripeSubscriptionCheckout() {
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const { toast } = useToast();

  const tiers: SubscriptionTier[] = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Essential healthcare access',
      price_monthly: 9.99,
      price_annual: 99.99,
      features: [
        'Up to 3 appointments/month',
        'Basic messaging',
        'Medical records access',
        'Email support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For regular healthcare needs',
      price_monthly: 29.99,
      price_annual: 299.99,
      features: [
        'Unlimited appointments',
        'Priority messaging',
        'Advanced medical records',
        'Priority support',
        'Specialist access',
        'Lab results tracking'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For clinics and organizations',
      price_monthly: 99.99,
      price_annual: 999.99,
      features: [
        'Everything in Professional',
        'Multi-user accounts',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantees',
        'Custom branding'
      ]
    }
  ];

  const handleSubscribe = async (tier: SubscriptionTier) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe",
          variant: "destructive"
        });
        return;
      }

      // Call Stripe checkout edge function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          tier_id: tier.id,
          billing_interval: billingInterval,
          price: billingInterval === 'monthly' ? tier.price_monthly : tier.price_annual
        }
      });

      if (error) throw error;

      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={billingInterval === 'monthly' ? 'default' : 'outline'}
          onClick={() => setBillingInterval('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={billingInterval === 'annual' ? 'default' : 'outline'}
          onClick={() => setBillingInterval('annual')}
        >
          Annual
          <span className="ml-2 text-xs">(Save 17%)</span>
        </Button>
        <InfoTooltip content="Annual plans save you money! Pay for 10 months and get 2 months free compared to monthly pricing." />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card key={tier.id} className={tier.id === 'professional' ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {tier.name}
                {tier.id === 'professional' && (
                  <Badge className="ml-2" variant="default">Popular</Badge>
                )}
              </CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ${billingInterval === 'monthly' ? tier.price_monthly : tier.price_annual}
                </span>
                <span className="text-muted-foreground">
                  /{billingInterval === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(tier)}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Subscribe'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            About Pricing
            <InfoTooltip content="All prices shown include applicable taxes. You can cancel anytime and you'll keep access until the end of your billing period. No hidden fees!" />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>✓ Cancel anytime - no long-term commitments</p>
          <p>✓ 14-day money-back guarantee</p>
          <p>✓ Secure payment processing via Stripe</p>
          <p>✓ You'll receive 30 days notice before any price changes</p>
        </CardContent>
      </Card>
    </div>
  );
}
