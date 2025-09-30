import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { PatientProfileEdit } from '@/components/profile/PatientProfileEdit';

export default function PatientProfileEditPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container max-w-4xl py-8 px-4 mt-16">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Edit Patient Profile</h1>
              <p className="text-muted-foreground">Update your personal and medical information</p>
            </div>
            <PatientProfileEdit />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
