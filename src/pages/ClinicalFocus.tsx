import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import ClinicalFocusMode from '@/components/ClinicalFocusMode';

export default function ClinicalFocus() {
  return (
    <DashboardLayout 
      title="Clinical Focus Mode"
      description="Optimize your clinical workflow"
    >
      <ClinicalFocusMode />
    </DashboardLayout>
  );
}