import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Users, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VirtualClinicWelcomeDialog } from '@/components/clinic/VirtualClinicWelcomeDialog';

export default function ClinicDashboard() {
  return (
    <ProtectedRoute allowedRoles={['clinic_admin']}>
      <ClinicDashboardContent />
    </ProtectedRoute>
  );
}

function ClinicDashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clinic, setClinic] = useState<any>(null);
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalSpecialists: 0,
    monthlyAppointments: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    fetchClinicData();
  }, [user]);

  const fetchClinicData = async () => {
    if (!user) return;

    const { data: clinicData } = await supabase
      .from('clinics')
      .select('*')
      .eq('created_by', user.id)
      .single();

    if (clinicData) {
      setClinic(clinicData);

      const { count: staffCount } = await supabase
        .from('clinic_staff')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicData.id)
        .eq('is_active', true);

      const { count: specialistCount } = await supabase
        .from('specialists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicData.id)
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        totalStaff: staffCount || 0,
        totalSpecialists: specialistCount || 0,
        monthlyAppointments: appointmentCount || 0,
        monthlyRevenue: 0,
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <DashboardLayout 
        title="Clinic Setup Required" 
        showBackButton={false}
        titleTooltip="Register your clinic to access the full dashboard and start managing appointments"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Clinic Found</CardTitle>
              <CardDescription>
                You don't have a clinic registered yet. Create one to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/clinic/setup')} size="lg" className="w-full">
                Create Clinic
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <VirtualClinicWelcomeDialog />
      <DashboardLayout
      title={clinic.name} 
      description={clinic.description}
      showBackButton={false}
      titleTooltip="Overview of your clinic's operations, staff, and performance metrics"
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStaff}</div>
              <p className="text-xs text-muted-foreground mt-1">Active team members</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Specialists</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <Building2 className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSpecialists}</div>
              <p className="text-xs text-muted-foreground mt-1">Healthcare providers</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Appointments</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calendar className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <DollarSign className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your clinic operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/clinic/staff')}>
                <Users className="mr-2 h-4 w-4" />
                Manage Staff
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/clinic/settings')}>
                <Building2 className="mr-2 h-4 w-4" />
                Clinic Settings
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/appointments')}>
                <Calendar className="mr-2 h-4 w-4" />
                View Appointments
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Clinic Information</CardTitle>
              <CardDescription>Your clinic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{clinic.clinic_type}</p>
                </div>
              </div>
              <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {clinic.city}, {clinic.state}, {clinic.country}
                  </p>
                </div>
              </div>
              <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${clinic.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {clinic.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
    </>
  );
}
