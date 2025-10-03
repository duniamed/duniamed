import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import ComplianceDashboardComponent from '@/components/ComplianceDashboard';

export default function ComplianceDashboard() {
  return (
    <DashboardLayout 
      title="Multi-Jurisdiction Compliance"
      description="Track regulatory compliance across 9 global jurisdictions"
    >
      <ComplianceDashboardComponent />
    </DashboardLayout>
  );
}