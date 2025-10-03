import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { NotificationChannels } from '@/components/NotificationChannels';

/**
 * C4 RESILIENCE - Notification Preferences Page
 * Multi-channel notification management for redundancy
 */

function NotificationPreferencesContent() {
  return (
    <DashboardLayout 
      title="Notification Preferences" 
      description="Manage your notification channels for reliable delivery"
    >
      <div className="space-y-6">
        <NotificationChannels />
      </div>
    </DashboardLayout>
  );
}

export default function NotificationPreferences() {
  return (
    <ProtectedRoute>
      <NotificationPreferencesContent />
    </ProtectedRoute>
  );
}
