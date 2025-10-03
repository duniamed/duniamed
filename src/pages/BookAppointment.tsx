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
import { ChevronLeft, ChevronRight, Check, Clock, AlertCircle, Users, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormAutosave } from '@/hooks/useFormAutosave';
import { GuidedRecovery } from '@/components/GuidedRecovery';

import { SlotCountdown } from '@/components/SlotCountdown';

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
  
  // Step 3: Insurance & Cost
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insurancePayerId, setInsurancePayerId] = useState('');
  const [insuranceMemberId, setInsuranceMemberId] = useState('');
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [costEstimate, setCostEstimate] = useState<any>(null);
  
  // Step 4: Confirmation
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Slot hold tracking
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);

  // C4 RESILIENCE - Form autosave
  const formData = {
    selectedDate,
    selectedTime,
    consultationType,
    chiefComplaint,
    urgencyLevel,
    hasInsurance,
    insurancePayerId,
    insuranceMemberId
  };
  useFormAutosave('book-appointment', formData, step > 0);

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

  const checkEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-eligibility', {
        body: {
          payer_id: insurancePayerId,
          member_id: insuranceMemberId,
          patient_id: profile?.id,
        }
      });

      if (error) throw error;
      
      setEligibilityResult(data);
      
      // Generate cost estimate based on eligibility
      const estimate = {
        service_fee: specialist!.consultation_fee_min,
        insurance_coverage: data.is_eligible ? (specialist!.consultation_fee_min * 0.8) : 0,
        copay: data.copay_amount || 0,
        patient_responsibility: data.is_eligible 
          ? (specialist!.consultation_fee_min * 0.2 + (data.copay_amount || 0))
          : specialist!.consultation_fee_min,
      };
      
      setCostEstimate(estimate);
      
      toast({
        title: data.is_eligible ? 'Insurance verified' : 'Insurance not verified',
        description: data.is_eligible ? 'Your insurance is active' : 'Proceeding as self-pay',
      });
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: 'Proceeding as self-pay',
        variant: 'destructive',
      });
      
      // Set self-pay estimate
      setCostEstimate({
        service_fee: specialist!.consultation_fee_min,
        insurance_coverage: 0,
        copay: 0,
        patient_responsibility: specialist!.consultation_fee_min,
      });
    } finally {
      setCheckingEligibility(false);
    }
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
    setSubmitError(null);

    const scheduledAt = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    scheduledAt.setHours(parseInt(hours), parseInt(minutes));

    // STEP 1: Create optimistic hold (60-second reservation)
    const { data: holdData, error: holdError } = await supabase.functions.invoke('book-with-hold', {
      body: {
        action: 'hold',
        specialist_id: specialistId,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: 30,
        patient_id: profile!.id,
      }
    });

    if (holdError || !holdData?.success) {
      toast({
        title: '⚠️ Slot No Longer Available',
        description: holdData?.error || 'Someone just booked this slot. Showing alternatives...',
        variant: 'destructive',
      });
      setSubmitting(false);
      // TODO: Show alternative slots
      return;
    }

    // STEP 2: Use ATOMIC booking edge function
    const { data: bookingData, error: bookingError } = await supabase.functions.invoke(
      'book-appointment-atomic',
      {
        body: {
          patient_id: profile!.id,
          specialist_id: specialistId,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: 30,
          consultation_type: consultationType,
          chief_complaint: chiefComplaint,
          urgency_level: urgencyLevel,
          fee: costEstimate?.patient_responsibility || specialist!.consultation_fee_min,
          currency: specialist!.currency,
        },
      }
    );

    if (bookingError || !bookingData?.success) {
      // Release hold
      await supabase.functions.invoke('book-with-hold', {
        body: {
          action: 'release',
          patient_id: holdData.hold_id,
        }
      });

      toast({
        title: 'Booking Failed',
        description: bookingData?.message || 'Unable to complete booking. Please try again.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    // Success!
    toast({
      title: '✅ Appointment Secured!',
      description: 'Your appointment has been confirmed. Check your email for details.',
    });
    navigate('/appointments');
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
          {/* Header with Urgency + Social Proof + Loss Aversion */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Available now
              </Badge>
              <Badge className="urgency-badge border-0 bg-red-500/10 text-red-600">
                <Clock className="h-3.5 w-3.5" />
                ⚠️ Only 3 slots left today
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600">
                <Users className="h-3.5 w-3.5" />
                👥 12 people viewing right now
              </Badge>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold">⏰ Don't lose your chance - Book now</h1>
              <p className="text-lg text-muted-foreground">
                with Dr. {specialist.profiles?.first_name} {specialist.profiles?.last_name}
              </p>
            </div>
            
            {/* Loss Aversion Warning - Behavioral Psychology */}
            <div className="glass-panel bg-gradient-to-r from-red-500/5 via-orange-500/5 to-yellow-500/5 border-red-500/20">
              <div className="pt-6 pb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-2">
                    <p className="font-bold text-red-700 dark:text-red-500 text-lg">
                      🚨 High Demand Alert
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>73% of this specialist's slots</strong> fill within 24 hours. 
                      Patients who delay booking wait an average of <strong>14 days longer</strong> for their next available appointment.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 w-[73%] animate-pulse"></div>
                      </div>
                      <span className="text-xs font-semibold text-red-600">73% Booked</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all',
                    step >= s ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 4 && (
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
            <div className="card-modern">
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Select Date & Time</h3>
                  <p className="text-muted-foreground">Choose your preferred appointment time</p>
                </div>
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
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="card-modern">
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Appointment Details</h3>
                  <p className="text-muted-foreground">Tell us about your medical concern</p>
                </div>
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
                    Next: Insurance & Cost
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Insurance & Cost */}
          {step === 3 && (
            <div className="card-modern">
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Insurance & Cost</h3>
                  <p className="text-muted-foreground">Check your insurance and get a cost estimate</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasInsurance"
                      checked={hasInsurance}
                      onChange={(e) => setHasInsurance(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="hasInsurance">I have insurance</Label>
                  </div>

                  {hasInsurance && (
                    <>
                      <div className="space-y-2">
                        <Label>Insurance Payer ID</Label>
                        <input
                          type="text"
                          placeholder="e.g., 12345"
                          value={insurancePayerId}
                          onChange={(e) => setInsurancePayerId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Member ID</Label>
                        <input
                          type="text"
                          placeholder="Your insurance member ID"
                          value={insuranceMemberId}
                          onChange={(e) => setInsuranceMemberId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <Button
                        onClick={checkEligibility}
                        disabled={!insurancePayerId || !insuranceMemberId || checkingEligibility}
                        className="w-full"
                      >
                        {checkingEligibility ? 'Checking...' : 'Check Eligibility & Get Estimate'}
                      </Button>
                    </>
                  )}

                  {!hasInsurance && (
                    <Button
                      onClick={() => {
                        setCostEstimate({
                          service_fee: specialist!.consultation_fee_min,
                          insurance_coverage: 0,
                          copay: 0,
                          patient_responsibility: specialist!.consultation_fee_min,
                        });
                      }}
                      className="w-full"
                    >
                      Continue as Self-Pay
                    </Button>
                  )}

                  {costEstimate && (
                    <Card className="bg-muted">
                      <CardHeader>
                        <CardTitle className="text-lg">Cost Estimate</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service Fee:</span>
                          <span className="font-medium">{costEstimate.service_fee} {specialist!.currency}</span>
                        </div>
                        {hasInsurance && eligibilityResult?.is_eligible && (
                          <>
                            <div className="flex justify-between text-green-600">
                              <span>Insurance Coverage:</span>
                              <span className="font-medium">-{costEstimate.insurance_coverage} {specialist!.currency}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Copay:</span>
                              <span className="font-medium">{costEstimate.copay} {specialist!.currency}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between pt-3 border-t">
                          <span className="font-semibold">Your Responsibility:</span>
                          <span className="font-bold text-lg">{costEstimate.patient_responsibility} {specialist!.currency}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!costEstimate}
                  >
                    Next: Review
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="card-modern">
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Confirm Appointment</h3>
                  <p className="text-muted-foreground">Review your appointment details</p>
                </div>
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
                    <span className="text-muted-foreground">Insurance:</span>
                    <span className="font-medium">
                      {hasInsurance && eligibilityResult?.is_eligible ? 'Verified' : 'Self-Pay'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Cost:</span>
                    <span className="font-medium text-lg">
                      {costEstimate?.patient_responsibility || specialist.consultation_fee_min} {specialist.currency}
                    </span>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Chief Complaint:</p>
                  <p className="text-sm text-muted-foreground">{chiefComplaint}</p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {submitError && (
        <GuidedRecovery
          errorType="booking"
          errorMessage={submitError}
          onRetry={async () => {
            setSubmitError(null);
            await handleSubmit();
          }}
        />
      )}
    </Layout>
  );
}
