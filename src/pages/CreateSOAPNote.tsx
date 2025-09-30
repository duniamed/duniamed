import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';

export default function CreateSOAPNote() {
  return (
    <ProtectedRoute allowedRoles={['specialist']}>
      <CreateSOAPNoteContent />
    </ProtectedRoute>
  );
}

function CreateSOAPNoteContent() {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [formData, setFormData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        profiles:patient_id (
          first_name,
          last_name
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (data) {
      setAppointment(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!specialist) {
        throw new Error('Specialist profile not found');
      }

      const { error } = await supabase.from('soap_notes').insert({
        patient_id: appointment.patient_id,
        specialist_id: specialist.id,
        appointment_id: appointmentId,
        subjective: formData.subjective || null,
        objective: formData.objective || null,
        assessment: formData.assessment || null,
        plan: formData.plan || null,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'SOAP note created successfully',
      });

      navigate(`/appointments/${appointmentId}`);
    } catch (error) {
      console.error('Error creating SOAP note:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create SOAP note',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Create SOAP Note</CardTitle>
                <CardDescription>
                  Patient: {appointment.profiles.first_name} {appointment.profiles.last_name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subjective">Subjective (S)</Label>
                <Textarea
                  id="subjective"
                  placeholder="Patient's reported symptoms, concerns, and history..."
                  value={formData.subjective}
                  onChange={(e) => setFormData({ ...formData, subjective: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  What the patient tells you about their symptoms and concerns
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objective (O)</Label>
                <Textarea
                  id="objective"
                  placeholder="Vital signs, physical examination findings, lab results..."
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Observable and measurable data from examination
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessment">Assessment (A)</Label>
                <Textarea
                  id="assessment"
                  placeholder="Diagnosis, differential diagnoses, clinical impression..."
                  value={formData.assessment}
                  onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Your professional interpretation and diagnosis
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Plan (P)</Label>
                <Textarea
                  id="plan"
                  placeholder="Treatment plan, medications, follow-up instructions..."
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Treatment plan and next steps for the patient
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create SOAP Note'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
