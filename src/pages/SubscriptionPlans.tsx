import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SubscriptionManager } from '@/components/SubscriptionManager';
import { StripeSubscriptionCheckout } from '@/components/StripeSubscriptionCheckout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * C16 PRICING - Subscription Plans Page
 * Users view tiers, manage subscriptions, track usage
 */

function SubscriptionPlansContent() {
  return (
    <DashboardLayout 
      title="Subscription Plans" 
      description="Manage your subscription and view available plans"
    >
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="manage">Current Plan</TabsTrigger>
          <TabsTrigger value="explore">Explore Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <SubscriptionManager />
        </TabsContent>

        <TabsContent value="explore">
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Compare our plans and choose the one that fits your needs. All plans include secure payment processing via Stripe.
            </p>
            <StripeSubscriptionCheckout />
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

export default function SubscriptionPlans() {
  return (
    <ProtectedRoute>
      <SubscriptionPlansContent />
    </ProtectedRoute>
  );
}
