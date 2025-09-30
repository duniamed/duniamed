import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PatientProfileEdit } from '@/components/profile/PatientProfileEdit';

export default function PatientProfileEditPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Edit Profile" description="Update your personal and medical information">
        <PatientProfileEdit />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
