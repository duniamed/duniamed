import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Users, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Clinic Found</CardTitle>
              <CardDescription>
                You don't have a clinic registered yet. Create one to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/clinic/setup')}>
                Create Clinic
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{clinic.name}</h1>
          <p className="text-muted-foreground">{clinic.description}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStaff}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Specialists</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSpecialists}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyAppointments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" onClick={() => navigate('/clinic/staff')}>
                Manage Staff
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate('/clinic/settings')}>
                Clinic Settings
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate('/appointments')}>
                View Appointments
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clinic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{clinic.clinic_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">
                  {clinic.city}, {clinic.state}, {clinic.country}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{clinic.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
