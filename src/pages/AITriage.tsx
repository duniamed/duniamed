import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import AITriageAssistant from '@/components/AITriageAssistant';

export default function AITriage() {
  return (
    <DashboardLayout 
      title="AI Triage"
      description="Get instant symptom assessment"
    >
      <AITriageAssistant />
    </DashboardLayout>
  );
}
