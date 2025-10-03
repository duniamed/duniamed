import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import EveningLoadFirewall from '@/components/EveningLoadFirewall';

export default function WorkQueue() {
  return (
    <DashboardLayout 
      title="Work Queue"
      description="Manage your clinical workload"
    >
      <EveningLoadFirewall />
    </DashboardLayout>
  );
}