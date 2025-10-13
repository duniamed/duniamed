// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Video, MapPin, User, Building2, Phone, Mail, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  consultation_type: string;
  chief_complaint: string;
  urgency_level: string;
  fee: number;
  currency: string;
  duration_minutes: number;
  clinic_id: string | null;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    email: string;
    phone: string | null;
    date_of_birth: string | null;
  };
  clinics: {
    id: string;
    name: string;
    clinic_type: string;
    phone: string | null;
    address: string | null;
  } | null;
}

interface PatientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  total_appointments: number;
  last_appointment: string | null;
  medical_notes: any[];
}

export default function SpecialistAppointments() {
  return (
    <ProtectedRoute allowedRoles={['specialist']}>
      <SpecialistAppointmentsContent />
    </ProtectedRoute>
  );
}

function SpecialistAppointmentsContent() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;

    // Unlimited Edge Function Capacities: No limits on database queries
    const { data: specialistData } = await supabase
      .from('specialists')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!specialistData) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url,
          date_of_birth
        ),
        clinics:clinic_id (
          id,
          name,
          clinic_type,
          phone,
          address
        )
      `)
      .eq('specialist_id', specialistData.id)
      .order('scheduled_at', { ascending: false });

    if (!error && data) {
      setAppointments(data as any);
    }
    setLoading(false);
  };

  const loadPatientProfile = async (patientId: string) => {
    // Unlimited Edge Function Capacities: Load complete patient history
    const { data: patientData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single();

    const { data: appointmentHistory, count } = await supabase
      .from('appointments')
      .select('scheduled_at', { count: 'exact' })
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false });

    const { data: notes } = await supabase
      .from('consultation_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (patientData) {
      setSelectedPatient({
        ...patientData,
        total_appointments: count || 0,
        last_appointment: appointmentHistory?.[0]?.scheduled_at || null,
        medical_notes: notes || [],
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filterAppointments = (filterType: 'upcoming' | 'past' | 'cancelled') => {
    const now = new Date();
    const filtered = appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduled_at);
      if (filterType === 'upcoming') {
        return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
      } else if (filterType === 'past') {
        return apt.status === 'completed';
      } else {
        return apt.status === 'cancelled';
      }
    });

    if (searchTerm) {
      return filtered.filter(apt => 
        apt.patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.clinics?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={appointment.patient.avatar_url || undefined} />
              <AvatarFallback>
                {appointment.patient.first_name[0]}{appointment.patient.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  {appointment.patient.first_name} {appointment.patient.last_name}
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => loadPatientProfile(appointment.patient.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Patient Profile</DialogTitle>
                    </DialogHeader>
                    {selectedPatient && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={selectedPatient.avatar_url || undefined} />
                            <AvatarFallback className="text-2xl">
                              {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-2xl font-bold">
                              {selectedPatient.first_name} {selectedPatient.last_name}
                            </h3>
                            <p className="text-muted-foreground">
                              {selectedPatient.date_of_birth && `DOB: ${format(new Date(selectedPatient.date_of_birth), 'PPP')}`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedPatient.email}</span>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedPatient.phone || 'Not provided'}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Visit History</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Total Appointments</p>
                                <p className="text-2xl font-bold">{selectedPatient.total_appointments}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Last Visit</p>
                                <p className="text-sm font-semibold">
                                  {selectedPatient.last_appointment 
                                    ? format(new Date(selectedPatient.last_appointment), 'PPP')
                                    : 'No visits'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {selectedPatient.medical_notes.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Recent Notes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {selectedPatient.medical_notes.map((note: any) => (
                                <div key={note.id} className="text-sm border-l-2 border-primary/30 pl-3">
                                  <p className="font-medium">{format(new Date(note.created_at), 'PPP')}</p>
                                  <p className="text-muted-foreground line-clamp-2">{note.notes}</p>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(appointment.scheduled_at), 'EEEE, MMMM d, yyyy')}
                <Clock className="h-3 w-3 ml-2" />
                {format(new Date(appointment.scheduled_at), 'h:mm a')}
              </CardDescription>
              {appointment.clinics && (
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="font-medium">Clinic:</span> {appointment.clinics.name}
                  <Badge variant="outline" className="ml-2">{appointment.clinics.clinic_type}</Badge>
                </div>
              )}
              {!appointment.clinics && (
                <div className="flex items-center gap-2 mt-1 text-sm">
                  <Badge variant="secondary">Private Practice</Badge>
                </div>
              )}
            </div>
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
              <Video className="h-4 w-4 text-blue-500" />
              <span>Video Consultation</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 text-green-500" />
              <span>In-Person Visit</span>
            </>
          )}
          <Badge variant="outline" className="ml-auto">
            {appointment.urgency_level}
          </Badge>
          <span className="text-muted-foreground">
            {appointment.duration_minutes} min
          </span>
        </div>

        {appointment.chief_complaint && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Chief Complaint:
            </p>
            <p className="line-clamp-2 font-medium">{appointment.chief_complaint}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm gap-2 pt-2 border-t">
          <span className="text-muted-foreground flex items-center gap-1">
            Fee: <span className="font-semibold text-foreground">{appointment.currency} {appointment.fee}</span>
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            {appointment.status === 'confirmed' && (
              <Button size="sm">
                Start Consultation
              </Button>
            )}
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
    <DashboardLayout 
      title="My Appointments" 
      description="View all your appointments across practices and clinics"
      titleTooltip="See everything: Patient profiles with full history, clinic information, visit types - all in one place. Click any patient's profile button to see their complete medical history and contact information."
    >
      <div className="space-y-6">
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  💡 What you see here
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                  <li>• <strong>All appointments</strong> from your private practice and affiliated clinics</li>
                  <li>• <strong>Patient profiles</strong> - Click "Profile" button to see full medical history</li>
                  <li>• <strong>Clinic information</strong> - See which clinic each appointment belongs to</li>
                  <li>• <strong>Contact details</strong> - Email and phone for each patient</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by patient name or clinic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

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
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
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
              <div className="grid gap-4">
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
              <div className="grid gap-4">
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
