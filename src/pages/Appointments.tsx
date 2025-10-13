import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, MapPin } from 'lucide-react';

// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  consultation_type: string;
  chief_complaint: string;
  urgency_level: string;
  fee: number;
  currency: string;
  clinic_id: string | null;
  patient_id: string;
  specialists: {
    id: string;
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  };
  clinics: {
    id: string;
    name: string;
    clinic_type: string;
  } | null;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    email: string;
    phone: string | null;
  };
}

export default function Appointments() {
  return (
    <ProtectedRoute>
      <AppointmentsContent />
    </ProtectedRoute>
  );
}

function AppointmentsContent() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        specialists:specialist_id (
          id,
          profiles:user_id (
            first_name,
            last_name
          )
        )
      `)
      .eq('patient_id', profile!.id)
      .order('scheduled_at', { ascending: false });

    if (!error && data) {
      setAppointments(data as any);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filterAppointments = (filterType: 'upcoming' | 'past' | 'cancelled') => {
    const now = new Date();
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduled_at);
      if (filterType === 'upcoming') {
        return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
      } else if (filterType === 'past') {
        return apt.status === 'completed';
      } else {
        return apt.status === 'cancelled';
      }
    });
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              Dr. {appointment.specialists.profiles?.first_name}{' '}
              {appointment.specialists.profiles?.last_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              {new Date(appointment.scheduled_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              <Clock className="h-3 w-3 ml-2" />
              {new Date(appointment.scheduled_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          {appointment.consultation_type === 'video' ? (
            <>
              <Video className="h-4 w-4" />
              <span>Video Consultation</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              <span>In-Person Visit</span>
            </>
          )}
          <Badge variant="outline" className="ml-auto">
            {appointment.urgency_level}
          </Badge>
        </div>

        <div className="text-sm">
          <p className="text-muted-foreground mb-1">Chief Complaint:</p>
          <p className="line-clamp-2">{appointment.chief_complaint}</p>
        </div>

        <div className="flex items-center justify-between text-sm gap-2">
          <span className="text-muted-foreground">
            Fee: {appointment.fee} {appointment.currency}
          </span>
          <div className="flex gap-2">
            {appointment.status === 'completed' && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/visit-confirmation/${appointment.id}`}>
                  Confirm Visit
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link to={`/appointments/${appointment.id}`}>View Details</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Appointments" description="View and manage your healthcare appointments">
      <div className="space-y-6">
        <Tabs defaultValue="upcoming">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4 mt-6">
              {filterAppointments('upcoming').length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                    <Button asChild>
                      <Link to="/search">Find a Specialist</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filterAppointments('upcoming').map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4 mt-6">
              {filterAppointments('past').length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No past appointments</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filterAppointments('past').map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4 mt-6">
              {filterAppointments('cancelled').length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No cancelled appointments</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filterAppointments('cancelled').map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              )}
            </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
