import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Bell, CheckCircle, XCircle } from 'lucide-react';

/**
 * C16 PRICING - Subscription Manager Component
 * Users view tiers, track usage, receive price change notices
 */

interface SubscriptionTier {
  id: string;
  tier_name: string;
  tier_level: string;
  features: any[];
  monthly_price: number;
  annual_price: number;
  usage_limits: any;
}

interface UserSubscription {
  id: string;
  tier_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  usage_current: any;
}

interface PriceChangeNotice {
  id: string;
  old_price: number;
  new_price: number;
  effective_date: string;
  reason: string;
}

export function SubscriptionManager() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [priceNotices, setPriceNotices] = useState<PriceChangeNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all active tiers
      const { data: tiersData } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });

      // Fetch user's current subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      // Fetch price change notices
      if (subData) {
        const { data: notices } = await supabase
          .from('price_change_notices')
          .select('*')
          .eq('affected_tier_id', subData.tier_id)
          .is('notice_sent_at', null)
          .order('effective_date', { ascending: true });

        setPriceNotices(notices || []);
      }

      setTiers(tiersData || []);
      setSubscription(subData);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUsagePercentage = (current: number, limit: number): number => {
    if (!limit) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const handlePauseSubscription = async () => {
    try {
      if (!subscription) return;

      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'paused' })
        .eq('id', subscription.id);

      if (error) throw error;

      toast({
        title: "Subscription Paused",
        description: "Your subscription has been paused. You can resume anytime.",
      });

      fetchSubscriptionData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause subscription",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading subscription data...</div>;
  }

  const currentTier = tiers.find(t => t.id === subscription?.tier_id);

  return (
    <div className="space-y-6">
      {/* Price Change Notices */}
      {priceNotices.length > 0 && (
        <Card className="border-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              Price Change Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priceNotices.map((notice) => (
              <div key={notice.id} className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <p className="text-sm font-medium">
                  Your subscription price will change in 30 days
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ${notice.old_price}/mo → ${notice.new_price}/mo
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Effective: {new Date(notice.effective_date).toLocaleDateString()}
                </p>
                {notice.reason && (
                  <p className="text-sm mt-2">{notice.reason}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      {subscription && currentTier && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan: {currentTier.tier_name}</CardTitle>
                <CardDescription>
                  ${currentTier.monthly_price}/month • {subscription.status}
                </CardDescription>
              </div>
              <Badge variant={subscription.auto_renew ? "default" : "secondary"}>
                {subscription.auto_renew ? "Auto-Renew On" : "Auto-Renew Off"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Usage Meters */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Usage This Month</h4>
              {Object.entries(currentTier.usage_limits || {}).map(([key, limit]: [string, any]) => {
                const current = subscription.usage_current?.[key] || 0;
                const percentage = calculateUsagePercentage(current, limit);
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{key.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">
                        {current} / {limit === -1 ? 'Unlimited' : limit}
                      </span>
                    </div>
                    {limit !== -1 && (
                      <Progress 
                        value={percentage} 
                        className={percentage > 80 ? 'bg-amber-200' : ''}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handlePauseSubscription}>
                Pause Subscription
              </Button>
              <Button variant="outline">
                Update Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Tiers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <Card key={tier.id} className={tier.id === subscription?.tier_id ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {tier.tier_name}
                {tier.id === subscription?.tier_id && (
                  <Badge variant="default">Current</Badge>
                )}
              </CardTitle>
              <div className="text-3xl font-bold">
                ${tier.monthly_price}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ${tier.annual_price}/year (save {Math.round((1 - (tier.annual_price / (tier.monthly_price * 12))) * 100)}%)
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(tier.features || []).slice(0, 5).map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {tier.id !== subscription?.tier_id && (
                <Button className="w-full mt-4">
                  {tier.monthly_price === 0 ? 'Start Free' : 'Upgrade'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
