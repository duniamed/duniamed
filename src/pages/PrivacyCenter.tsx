import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PrivacyDashboard } from '@/components/PrivacyDashboard';

/**
 * C15 PRIVACY - Privacy Center Page
 * Patients manage data access, deletion requests, and view summaries
 */

function PrivacyCenterContent() {
  return (
    <DashboardLayout 
      title="Privacy Center" 
      description="Manage your data and privacy preferences"
    >
      <PrivacyDashboard />
    </DashboardLayout>
  );
}

export default function PrivacyCenter() {
  return (
    <ProtectedRoute>
      <PrivacyCenterContent />
    </ProtectedRoute>
  );
}
