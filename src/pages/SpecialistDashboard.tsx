import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SpecialistData {
  id: string;
  consultation_fee_min: number;
  consultation_fee_max: number;
  currency: string;
  total_consultations: number;
  average_rating: number;
  total_reviews: number;
  is_accepting_patients: boolean;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  consultation_type: string;
  patient: {
    first_name: string;
    last_name: string;
  };
}

export default function SpecialistDashboard() {
  return (
    <ProtectedRoute allowedRoles={['specialist']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [specialist, setSpecialist] = useState<SpecialistData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weekRevenue: 0,
    totalPatients: 0,
    avgConsultation: 0,
  });

  useEffect(() => {
    fetchSpecialistData();
    fetchAppointments();
  }, [user]);

  const fetchSpecialistData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('specialists')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setSpecialist(data);
    }
  };

  const fetchAppointments = async () => {
    if (!user) return;

    const { data: specialistData } = await supabase
      .from('specialists')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!specialistData) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        status,
        consultation_type,
        fee,
        patient:patient_id (
          first_name,
          last_name
        )
      `)
      .eq('specialist_id', specialistData.id)
      .gte('scheduled_at', today.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (!error && data) {
      setAppointments(data as any);
      
      // Calculate stats
      const todayCount = data.filter(apt => {
        const aptDate = new Date(apt.scheduled_at);
        return aptDate.toDateString() === today.toDateString();
      }).length;

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      const weekRevenue = data
        .filter(apt => new Date(apt.scheduled_at) >= weekStart && apt.status === 'completed')
        .reduce((sum, apt) => sum + Number(apt.fee || 0), 0);

      setStats({
        todayAppointments: todayCount,
        weekRevenue,
        totalPatients: data.length,
        avgConsultation: specialist?.consultation_fee_min || 0,
      });
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Specialist Dashboard</h1>
              <p className="text-muted-foreground">Manage your practice and appointments</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/specialist/availability')}>
                <Clock className="mr-2 h-4 w-4" />
                Manage Availability
              </Button>
              <Button onClick={() => navigate('/specialist/profile')}>
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.todayAppointments > 0 ? 'Upcoming today' : 'No appointments'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Week Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {specialist?.currency} {stats.weekRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{specialist?.total_consultations || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {specialist?.average_rating?.toFixed(1) || '0.0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {specialist?.total_reviews || 0} reviews
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled consultations</CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming appointments
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {appointment.patient?.first_name} {appointment.patient?.last_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(appointment.scheduled_at), 'MMM dd, yyyy - hh:mm a')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{appointment.consultation_type}</Badge>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {appointment.duration_minutes} min
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
