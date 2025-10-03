import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import WhatsAppManager from '@/components/WhatsAppManager';

export default function WhatsAppMessages() {
  return (
    <DashboardLayout title="WhatsApp Messages">
      <WhatsAppManager />
    </DashboardLayout>
  );
}
