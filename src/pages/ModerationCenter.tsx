import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import ModerationDashboard from '@/components/ModerationDashboard';

export default function ModerationCenter() {
  return (
    <DashboardLayout title="AI Moderation Center">
      <ModerationDashboard />
    </DashboardLayout>
  );
}
