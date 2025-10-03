import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, Gift } from 'lucide-react';

/**
 * C17 ESSENTIALS - Feature Entitlement Guard
 * Controls access to features based on subscription tier and trial status
 */

interface FeatureEntitlement {
  id: string;
  feature_key: string;
  granted_by: string;
  expires_at: string | null;
  trial_mode: boolean;
  usage_count: number;
  usage_limit: number | null;
}

interface FeatureFlag {
  feature_key: string;
  feature_name: string;
  is_essential: boolean;
  tier_availability: string[];
}

interface Props {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureEntitlementGuard({ featureKey, children, fallback }: Props) {
  const [hasAccess, setHasAccess] = useState(false);
  const [entitlement, setEntitlement] = useState<FeatureEntitlement | null>(null);
  const [feature, setFeature] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEntitlement();
  }, [featureKey]);

  const checkEntitlement = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Check feature flag
      const { data: flagData } = await (supabase as any)
        .from('feature_flags')
        .select('*')
        .eq('feature_key', featureKey)
        .single();

      setFeature(flagData as FeatureFlag);

      // Essential features are always available
      if (flagData?.is_essential) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Check user entitlement
      const { data: entitlementData } = await (supabase as any)
        .from('user_entitlements')
        .select('*')
        .eq('user_id', user.id)
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (entitlementData) {
        // Check expiration
        const expired = entitlementData.expires_at && new Date(entitlementData.expires_at) < new Date();
        
        // Check usage limit
        const limitReached = entitlementData.usage_limit && 
          entitlementData.usage_count >= entitlementData.usage_limit;

        setHasAccess(!expired && !limitReached);
        setEntitlement(entitlementData as FeatureEntitlement);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error checking entitlement:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14); // 14-day trial

      const { error } = await (supabase as any)
        .from('user_entitlements')
        .insert({
          user_id: user.id,
          feature_key: featureKey,
          granted_by: 'trial',
          expires_at: expiresAt.toISOString(),
          trial_mode: true,
          usage_limit: 50
        });

      if (error) throw error;

      await checkEntitlement();
    } catch (error) {
      console.error('Error starting trial:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  if (hasAccess) {
    // Show trial badge if in trial mode
    if (entitlement?.trial_mode) {
      const daysLeft = entitlement.expires_at 
        ? Math.ceil((new Date(entitlement.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Gift className="h-3 w-3" />
              Trial: {daysLeft} days left
            </Badge>
            {entitlement.usage_limit && (
              <Badge variant="outline">
                {entitlement.usage_count} / {entitlement.usage_limit} uses
              </Badge>
            )}
          </div>
          {children}
        </div>
      );
    }

    return <>{children}</>;
  }

  // Show upgrade prompt or fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          {feature?.feature_name || 'Premium Feature'}
        </CardTitle>
        <CardDescription>
          This feature is not included in your current plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4" />
          Available in: {feature?.tier_availability?.join(', ') || 'Premium plans'}
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleStartTrial} variant="outline">
            <Gift className="h-4 w-4 mr-2" />
            Start 14-Day Trial
          </Button>
          <Button>
            Upgrade Plan
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          No credit card required for trial • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}
