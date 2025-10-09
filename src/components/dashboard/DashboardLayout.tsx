import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PatientSidebar } from './PatientSidebar';
import { SpecialistSidebar } from './SpecialistSidebar';
import { ClinicSidebar } from './ClinicSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showBackButton?: boolean;
  titleTooltip?: string;
}

export function DashboardLayout({ children, title, description, showBackButton = true, titleTooltip }: DashboardLayoutProps) {
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

  const getDashboardRoute = () => {
    switch (profile?.role) {
      case 'patient':
        return '/patient/dashboard';
      case 'specialist':
        return '/specialist/dashboard';
      case 'clinic_admin':
        return '/clinic/dashboard';
      default:
        return '/patient/dashboard';
    }
  };

  const canGoBack = () => {
    // Don't show back on main dashboard pages
    const mainDashboards = ['/patient/dashboard', '/specialist/dashboard', '/clinic/dashboard'];
    return !mainDashboards.includes(location.pathname);
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        {getSidebar()}
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 flex flex-col mt-16">
            <header className="sticky top-16 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
              <SidebarTrigger />
              {showBackButton && canGoBack() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(getDashboardRoute())}
                  className="gap-2 hover:bg-muted/50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              )}
              <div className="flex-1 flex items-center gap-2">
                {title && (
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold">{title}</h1>
                    {titleTooltip && (
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="text-sm">{titleTooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
            </header>
            <div className="flex-1 p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
