import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, DollarSign, Clock, TrendingUp, MessageSquare, Video, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { VerificationReminders } from '@/components/VerificationReminders';
import { useActivity } from '@/hooks/useActivity';

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
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logActivity } = useActivity();
  const [specialist, setSpecialist] = useState<SpecialistData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weekRevenue: 0,
    totalPatients: 0,
    avgConsultation: 0,
  });

  // Log activity every 5 minutes to keep specialist marked as online
  useEffect(() => {
    if (!user || !isOnline) return;

    const activityInterval = setInterval(() => {
      logActivity('dashboard_active', 'specialist', specialist?.id);
    }, 5 * 60 * 1000); // Every 5 minutes

    // Log initial activity
    logActivity('dashboard_viewed', 'specialist', specialist?.id);

    return () => clearInterval(activityInterval);
  }, [user, isOnline, specialist?.id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchSpecialistData(),
          fetchOnlineStatus(),
          fetchAppointments()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  const fetchOnlineStatus = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('specialists')
      .select('is_online')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching online status:', error);
      return;
    }
    if (data) setIsOnline(data.is_online || false);
  };

  const toggleOnlineStatus = async (checked: boolean) => {
    if (!user) return;
    const { error } = await supabase
      .from('specialists')
      .update({ is_online: checked })
      .eq('user_id', user.id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update online status. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsOnline(checked);
    toast({
      title: checked ? '🟢 You\'re Online' : '⚫ You\'re Offline',
      description: checked ? 'Patients can now request instant consultations' : 'You won\'t receive instant consultation requests',
    });
  };

  const fetchSpecialistData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('specialists')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching specialist data:', error);
      throw error;
    }
    
    if (data) {
      setSpecialist(data);
    }
  };

  const fetchAppointments = async () => {
    if (!user) return;

    const { data: specialistData, error: specialistError } = await supabase
      .from('specialists')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (specialistError) {
      console.error('Error fetching specialist ID:', specialistError);
      throw specialistError;
    }

    if (!specialistData) {
      console.warn('No specialist record found for user');
      return;
    }

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

    if (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }

    if (data) {
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

  if (!specialist) {
    return (
      <DashboardLayout 
        title="Specialist Dashboard"
        description="Complete your profile setup"
        showBackButton={false}
      >
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Profile Setup Required</CardTitle>
            <CardDescription>
              Your specialist profile needs to be completed before you can access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              It looks like your specialist profile hasn't been created yet. This usually happens automatically during signup.
            </p>
            <Button onClick={() => navigate('/specialist/profile/edit')}>
              Complete Your Profile
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={`Welcome, Dr. ${profile?.last_name || ''}`}
      description="Manage your practice and appointments"
      showBackButton={false}
      titleTooltip="Your personalized dashboard showing today's schedule, revenue, and patient statistics"
    >
      <div className="space-y-8">
        {/* Hero Section with Status Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Your Practice Dashboard
            </h2>
            <p className="text-muted-foreground text-lg">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex flex-col gap-4">
            <Card className="p-4 border-2 border-primary/20 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Availability Status</span>
                  <span className="text-xs text-muted-foreground">
                    {isOnline ? 'Accept instant consultations' : 'Only scheduled appointments'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {isOnline ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 animate-pulse" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <Switch checked={isOnline} onCheckedChange={toggleOnlineStatus} />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/50" onClick={() => navigate('/appointments')}>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Today's Schedule</h3>
              <p className="text-3xl font-bold text-primary">{stats.todayAppointments}</p>
              <p className="text-sm text-muted-foreground mt-1">appointments</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/50" onClick={() => navigate('/messages')}>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Messages</h3>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground mt-1">new messages</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/50" onClick={() => navigate('/specialist/availability')}>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Manage Hours</h3>
              <p className="text-sm text-muted-foreground mt-2">Set your availability</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Week Revenue</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {specialist?.currency} {stats.weekRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{specialist?.total_consultations || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">All time consultations</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <TrendingUp className="h-5 w-5 text-yellow-500" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {specialist?.average_rating?.toFixed(1) || '0.0'} ⭐
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {specialist?.total_reviews || 0} reviews
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Video className="h-5 w-5 text-purple-500" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Fee</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {specialist?.currency} {specialist?.consultation_fee_min || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per consultation</p>
            </CardContent>
          </Card>
        </div>

        {/* Verification Reminders */}
        <VerificationReminders />

        {/* Upcoming Appointments */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Upcoming Appointments</CardTitle>
                <CardDescription className="text-base">Your scheduled consultations</CardDescription>
              </div>
              <Button onClick={() => navigate('/appointments')} variant="outline" size="lg">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-xl font-medium text-muted-foreground mb-2">No upcoming appointments</p>
                <p className="text-sm text-muted-foreground">Patients will be able to book with you soon!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="group flex items-center justify-between p-5 border-2 rounded-xl hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-all duration-200 hover:shadow-md"
                    onClick={() => navigate(`/appointments/${appointment.id}`)}
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        {appointment.consultation_type === 'video' ? (
                          <Video className="h-6 w-6 text-primary" />
                        ) : (
                          <Calendar className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-lg">
                          {appointment.patient?.first_name} {appointment.patient?.last_name}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                          {format(new Date(appointment.scheduled_at), 'EEEE, MMM dd, yyyy')} at {format(new Date(appointment.scheduled_at), 'hh:mm a')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-bold">{appointment.duration_minutes} min</p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="text-base py-2 px-4 capitalize"
                      >
                        {appointment.consultation_type}
                      </Badge>
                      <Badge className={`${getStatusColor(appointment.status)} text-white text-base py-2 px-4 capitalize`}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
