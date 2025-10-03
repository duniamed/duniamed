import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, FileSignature, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Confirmation {
  id: string;
  appointment_id: string;
  patient_confirmed: boolean;
  patient_confirmed_at: string | null;
  specialist_confirmed: boolean;
  specialist_confirmed_at: string | null;
  service_delivered: boolean | null;
  dispute_opened: boolean;
  dispute_reason: string | null;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  chief_complaint: string;
  status: string;
  specialists: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

function VisitConfirmationContent() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [userRole, setUserRole] = useState<'patient' | 'specialist' | null>(null);
  const [signature, setSignature] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDispute, setShowDispute] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [appointmentId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load appointment
      const { data: aptData, error: aptError } = await supabase
        .from('appointments')
        .select(`
          *,
          specialists!appointments_specialist_id_fkey (
            profiles!specialists_user_id_fkey (first_name, last_name)
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (aptError) throw aptError;
      setAppointment(aptData as any);

      // Determine user role
      if (aptData.patient_id === user.id) {
        setUserRole('patient');
      } else {
        const { data: specialist } = await supabase
          .from('specialists')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (specialist && aptData.specialist_id === specialist.id) {
          setUserRole('specialist');
        }
      }

      // Load or create confirmation
      let { data: confData, error: confError } = await supabase
        .from('visit_confirmations')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (confError && confError.code !== 'PGRST116') throw confError;

      if (!confData) {
        const { data: newConf, error: createError } = await supabase
          .from('visit_confirmations')
          .insert({ appointment_id: appointmentId })
          .select()
          .single();

        if (createError) throw createError;
        confData = newConf;
      }

      setConfirmation(confData as any);
    } catch (error: any) {
      toast({
        title: 'Error loading confirmation',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmation || !signature.trim()) {
      toast({
        title: 'Signature required',
        description: 'Please type your full name as signature',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updates: any = {
        service_delivered: true,
      };

      if (userRole === 'patient') {
        updates.patient_confirmed = true;
        updates.patient_confirmed_at = new Date().toISOString();
        updates.patient_signature = signature;
      } else {
        updates.specialist_confirmed = true;
        updates.specialist_confirmed_at = new Date().toISOString();
        updates.specialist_signature = signature;
      }

      const { error } = await supabase
        .from('visit_confirmations')
        .update(updates)
        .eq('id', confirmation.id);

      if (error) throw error;

      toast({
        title: 'Visit confirmed',
        description: 'Thank you for confirming service delivery',
      });

      loadData();
      setSignature('');
    } catch (error: any) {
      toast({
        title: 'Error confirming visit',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDispute = async () => {
    if (!confirmation || !disputeReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for the dispute',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('visit_confirmations')
        .update({
          dispute_opened: true,
          dispute_opened_at: new Date().toISOString(),
          dispute_reason: disputeReason,
          service_delivered: false,
        })
        .eq('id', confirmation.id);

      if (error) throw error;

      toast({
        title: 'Dispute opened',
        description: 'Your dispute has been recorded and will be reviewed',
      });

      loadData();
      setDisputeReason('');
      setShowDispute(false);
    } catch (error: any) {
      toast({
        title: 'Error opening dispute',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const bothConfirmed = confirmation?.patient_confirmed && confirmation?.specialist_confirmed;
  const hasDispute = confirmation?.dispute_opened;

  return (
    <DashboardLayout>
      <div className="container-modern py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileSignature className="h-8 w-8" />
              Post-Visit Confirmation
            </h1>
            <p className="text-muted-foreground mt-2">
              Confirm service delivery with digital signature
            </p>
          </div>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Visit Details</CardTitle>
              <CardDescription>
                {new Date(appointment?.scheduled_at || '').toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="font-medium">
                  Dr. {appointment?.specialists?.profiles?.first_name}{' '}
                  {appointment?.specialists?.profiles?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="font-medium">{appointment?.chief_complaint}</p>
              </div>
            </CardContent>
          </Card>

          {/* Confirmation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Confirmation Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">Patient Confirmation</span>
                {confirmation?.patient_confirmed ? (
                  <Badge className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Confirmed
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">Specialist Confirmation</span>
                {confirmation?.specialist_confirmed ? (
                  <Badge className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Confirmed
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>

              {bothConfirmed && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-900 dark:text-green-100 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Visit fully confirmed - Payment processing
                  </p>
                </div>
              )}

              {hasDispute && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-900 dark:text-red-100 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Dispute opened - Under review
                  </p>
                  {confirmation?.dispute_reason && (
                    <p className="text-xs mt-2 text-red-800 dark:text-red-200">
                      Reason: {confirmation.dispute_reason}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Card */}
          {!bothConfirmed && !hasDispute && userRole && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {userRole === 'patient' && !confirmation?.patient_confirmed && 'Patient Confirmation'}
                  {userRole === 'specialist' && !confirmation?.specialist_confirmed && 'Specialist Confirmation'}
                </CardTitle>
                <CardDescription>
                  Confirm that the service was delivered as scheduled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showDispute ? (
                  <>
                    <div>
                      <Label>Digital Signature (Type your full name)</Label>
                      <Textarea
                        placeholder="Type your full name..."
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleConfirm} className="flex-1">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm Service Delivered
                      </Button>
                      {userRole === 'patient' && (
                        <Button
                          variant="outline"
                          onClick={() => setShowDispute(true)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Dispute
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Dispute Reason</Label>
                      <Textarea
                        placeholder="Explain why service was not delivered as expected..."
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleDispute} variant="destructive" className="flex-1">
                        Open Dispute
                      </Button>
                      <Button variant="outline" onClick={() => setShowDispute(false)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function VisitConfirmation() {
  return (
    <ProtectedRoute allowedRoles={['patient', 'specialist']}>
      <VisitConfirmationContent />
    </ProtectedRoute>
  );
}
