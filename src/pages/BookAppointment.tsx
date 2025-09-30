import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Check, Clock, AlertCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Specialist {
  id: string;
  consultation_fee_min: number;
  consultation_fee_max: number;
  currency: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export default function BookAppointment() {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <BookAppointmentContent />
    </ProtectedRoute>
  );
}

function BookAppointmentContent() {
  const { id: specialistId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Step 1: Date & Time
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Step 2: Details
  const [consultationType, setConsultationType] = useState<'video' | 'in_person'>('video');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'routine' | 'urgent' | 'emergency'>('routine');
  
  // Step 3: Confirmation
  const [submitting, setSubmitting] = useState(false);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  useEffect(() => {
    fetchSpecialist();
  }, [specialistId]);

  const fetchSpecialist = async () => {
    const { data, error } = await supabase
      .from('specialists')
      .select(`
        id,
        consultation_fee_min,
        consultation_fee_max,
        currency,
        profiles:user_id (
          first_name,
          last_name
        )
      `)
      .eq('id', specialistId)
      .single();

    if (!error && data) {
      setSpecialist(data as any);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!profile) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to book an appointment',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!selectedDate || !selectedTime || !chiefComplaint) {
      toast({
        title: 'Missing information',
        description: 'Please complete all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const scheduledAt = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    scheduledAt.setHours(parseInt(hours), parseInt(minutes));

    const { error } = await supabase.from('appointments').insert({
      patient_id: profile!.id,
      specialist_id: specialistId,
      consultation_type: consultationType,
      scheduled_at: scheduledAt.toISOString(),
      chief_complaint: chiefComplaint,
      urgency_level: urgencyLevel,
      status: 'pending',
      fee: specialist!.consultation_fee_min,
      currency: specialist!.currency,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to book appointment. Please try again.',
        variant: 'destructive',
      });
      setSubmitting(false);
    } else {
      toast({
        title: 'Appointment booked!',
        description: 'Your appointment request has been submitted.',
      });
      navigate('/appointments');
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
      <Layout>
        <div className="container-modern py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Specialist not found</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-modern py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header with Urgency */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Available now
              </Badge>
              <Badge className="urgency-badge border-0">
                <Clock className="h-3.5 w-3.5" />
                Only 3 slots left today
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                12 people viewing
              </Badge>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold">Don't delay your health - Book now</h1>
              <p className="text-lg text-muted-foreground">
                with Dr. {specialist.profiles?.first_name} {specialist.profiles?.last_name}
              </p>
            </div>
            
            {/* Loss Aversion Warning */}
            <Card className="bg-yellow-500/5 border-yellow-500/20">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-yellow-700 dark:text-yellow-500">
                      Slots filling fast
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This specialist's calendar fills up quickly. Book now to avoid waiting weeks for your next available appointment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all',
                    step >= s ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'h-0.5 w-12 transition-all',
                      step > s ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Date & Time */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
                <CardDescription>Choose your preferred appointment time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                    className={cn('rounded-md border p-3 pointer-events-auto')}
                  />
                </div>

                {selectedDate && (
                  <div className="space-y-2">
                    <Label>Time Slot</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? 'default' : 'outline'}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!selectedDate || !selectedTime}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
                <CardDescription>Tell us about your medical concern</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Consultation Type</Label>
                  <Select value={consultationType} onValueChange={(v: any) => setConsultationType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Consultation</SelectItem>
                      <SelectItem value="in_person">In-Person Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Chief Complaint *</Label>
                  <Textarea
                    placeholder="Briefly describe your symptoms or reason for visit..."
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Urgency Level</Label>
                  <Select value={urgencyLevel} onValueChange={(v: any) => setUrgencyLevel(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!chiefComplaint}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm Appointment</CardTitle>
                <CardDescription>Review your appointment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Doctor:</span>
                    <span className="font-medium">
                      Dr. {specialist.profiles?.first_name} {specialist.profiles?.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{consultationType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Urgency:</span>
                    <span className="font-medium capitalize">{urgencyLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee:</span>
                    <span className="font-medium">
                      {specialist.consultation_fee_min} {specialist.currency}
                    </span>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Chief Complaint:</p>
                  <p className="text-sm text-muted-foreground">{chiefComplaint}</p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
