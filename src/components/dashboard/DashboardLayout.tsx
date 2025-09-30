import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PatientSidebar } from './PatientSidebar';
import { SpecialistSidebar } from './SpecialistSidebar';
import { ClinicSidebar } from './ClinicSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showBackButton?: boolean;
}

export function DashboardLayout({ children, title, description, showBackButton = true }: DashboardLayoutProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getSidebar = () => {
    switch (profile?.role) {
      case 'patient':
        return <PatientSidebar />;
      case 'specialist':
        return <SpecialistSidebar />;
      case 'clinic_admin':
        return <ClinicSidebar />;
      default:
        return <PatientSidebar />;
    }
  };

  const canGoBack = () => {
    // Don't show back on main dashboard pages
    const mainDashboards = ['/patient/dashboard', '/specialist/dashboard', '/clinic/dashboard'];
    return !mainDashboards.includes(location.pathname);
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full">
        {getSidebar()}
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            {showBackButton && canGoBack() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div className="flex-1">
              {title && <h1 className="text-lg font-semibold">{title}</h1>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          </header>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
