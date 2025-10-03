import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import DocuSignManager from '@/components/DocuSignManager';

export default function DocumentSignatures() {
  return (
    <DashboardLayout title="E-Signatures">
      <DocuSignManager />
    </DashboardLayout>
  );
}
