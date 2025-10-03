import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import LegalArchiveManager from '@/components/LegalArchiveManager';

export default function LegalArchives() {
  return (
    <DashboardLayout title="Legal Archives">
      <LegalArchiveManager />
    </DashboardLayout>
  );
}
