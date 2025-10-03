import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import CredentialManager from '@/components/CredentialManager';

export default function CredentialVerification() {
  return (
    <DashboardLayout title="Credential Verification">
      <CredentialManager />
    </DashboardLayout>
  );
}