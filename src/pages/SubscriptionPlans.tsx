import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SubscriptionManager } from '@/components/SubscriptionManager';

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
      <SubscriptionManager />
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
