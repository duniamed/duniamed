import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { NotificationChannels } from '@/components/NotificationChannels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * C4 RESILIENCE - Notification Preferences Page
 * Multi-channel notification management for redundancy
 */

function NotificationPreferencesContent() {
  return (
    <DashboardLayout 
      title="Notification Preferences (C4)" 
      description="Manage multi-channel notifications for resilience"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Multi-Channel Notification Settings</CardTitle>
            <CardDescription>
              Add multiple channels to ensure critical messages reach you even during outages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationChannels />
          </CardContent>
        </Card>
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
