import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import GoogleBusinessManager from '@/components/GoogleBusinessManager';

export default function GoogleBusinessProfile() {
  return (
    <DashboardLayout title="Google Business Profile">
      <GoogleBusinessManager />
    </DashboardLayout>
  );
}
