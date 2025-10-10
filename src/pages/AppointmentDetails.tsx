import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Video, MapPin, DollarSign, AlertCircle, XCircle } from 'lucide-react';
import { VisitConfirmationDialog } from '@/components/VisitConfirmationDialog';

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  consultation_type: string;
  chief_complaint: string;
  urgency_level: string;
  fee: number;
  currency: string;
  notes: string;
  cancellation_reason: string;
  specialists: {
    id: string;
    profiles: {
      first_name: string;
      last_name: string;
      phone: string;
    };
  };
}

export default function AppointmentDetails() {
  return (
    <ProtectedRoute>
      <AppointmentDetailsContent />
    </ProtectedRoute>
  );
}

function AppointmentDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        specialists:specialist_id (
          id,
          profiles:user_id (
            first_name,
            last_name,
            phone
          )
        )
      `)
      .eq('id', id)
      .eq('patient_id', profile!.id)
      .single();

    if (!error && data) {
      setAppointment(data as any);
    }
    setLoading(false);
  };

  const handleCompleteAppointment = async () => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Appointment marked as completed',
      });

      fetchAppointment();
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete appointment',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_by: profile!.id,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Cancelled by patient',
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Appointment cancelled',
        description: 'Your appointment has been cancelled',
      });
      navigate('/appointments');
    }

    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <DashboardLayout 
        title="Appointment Details"
        description="View appointment information"
      >
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Appointment not found</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const canCancel = appointment.status !== 'cancelled' && 
                    appointment.status !== 'completed' && 
                    new Date(appointment.scheduled_at) > new Date();

  return (
    <DashboardLayout 
      title="Appointment Details"
      description="View your appointment information"
    >
      <div className="max-w-3xl space-y-6">
        <div className="flex items-start justify-end">
          <Badge className={
              appointment.status === 'confirmed' ? 'bg-blue-500' :
              appointment.status === 'completed' ? 'bg-green-500' :
              appointment.status === 'cancelled' ? 'bg-red-500' :
              'bg-yellow-500'
            }>
            {appointment.status}
          </Badge>
        </div>

        <Card>
            <CardHeader>
              <CardTitle>
                Dr. {appointment.specialists.profiles?.first_name}{' '}
                {appointment.specialists.profiles?.last_name}
              </CardTitle>
              <CardDescription>
                {appointment.consultation_type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.scheduled_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.scheduled_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {appointment.consultation_type === 'video' ? (
                    <Video className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Consultation Type</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.consultation_type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Urgency Level</p>
                    <p className="text-sm text-muted-foreground capitalize">{appointment.urgency_level}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Consultation Fee</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.fee} {appointment.currency}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Chief Complaint</h3>
                <p className="text-muted-foreground">{appointment.chief_complaint}</p>
              </div>

              {appointment.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Doctor's Notes</h3>
                    <p className="text-muted-foreground">{appointment.notes}</p>
                  </div>
                </>
              )}

              {appointment.cancellation_reason && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                      <XCircle className="h-4 w-4" />
                      Cancellation Reason
                    </h3>
                    <p className="text-sm text-muted-foreground">{appointment.cancellation_reason}</p>
                  </div>
                </>
              )}

              <Separator />
              
              <div className="flex flex-col gap-2">
                {appointment.status === 'completed' && (
                  <VisitConfirmationDialog
                    appointmentId={id!}
                    userType={profile?.role === 'patient' ? 'patient' : 'specialist'}
                    onClose={() => {}}
                    onConfirmed={() => fetchAppointment()}
                  />
                )}

                {appointment.status === 'scheduled' && profile?.role === 'specialist' && (
                  <Button onClick={handleCompleteAppointment}>
                    Mark as Completed
                  </Button>
                )}

                {appointment.status === 'completed' && profile?.role === 'patient' && (
                  <Button onClick={() => navigate(`/reviews/create/${id}`)}>
                    Leave a Review
                  </Button>
                )}

                {appointment.status === 'completed' && profile?.role === 'specialist' && (
                  <>
                    <Button onClick={() => navigate(`/soap-notes/create/${id}`)}>
                      Create SOAP Note
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/prescriptions/create/${id}`)}>
                      Create Prescription
                    </Button>
                  </>
                )}

                {canCancel && profile?.role === 'patient' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Appointment
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this appointment? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>

        <Button variant="outline" onClick={() => navigate('/appointments')}>
          Back to Appointments
        </Button>
      </div>
    </DashboardLayout>
  );
}
