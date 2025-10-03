import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import APMMonitoringDashboard from '@/components/APMMonitoringDashboard';

export default function APMMonitoring() {
  return (
    <DashboardLayout title="APM Monitoring">
      <APMMonitoringDashboard />
    </DashboardLayout>
  );
}
