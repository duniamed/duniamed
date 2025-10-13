import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function CreatePrescription() {
  return (
    <ProtectedRoute allowedRoles={['specialist']}>
      <CreatePrescriptionContent />
    </ProtectedRoute>
  );
}

function CreatePrescriptionContent() {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: '',
    generic_name: '',
    dosage: '',
    frequency: '',
    duration_days: '',
    quantity: '',
    refills_allowed: '0',
    instructions: '',
    warnings: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: appointment } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('id', appointmentId)
        .single();

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const { data: specialist } = await supabase
        .from('specialists')
        .select('id, license_country')
        .eq('user_id', user?.id)
        .single();

      if (!specialist) {
        throw new Error('Specialist profile not found');
      }

      const { data: patientProfile } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', appointment.patient_id)
        .single();

      const prescriptionNumber = `RX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { error } = await supabase.from('prescriptions').insert({
        prescription_number: prescriptionNumber,
        patient_id: appointment.patient_id,
        specialist_id: specialist.id,
        appointment_id: appointmentId,
        medication_name: formData.medication_name,
        generic_name: formData.generic_name || null,
        dosage: formData.dosage,
        frequency: formData.frequency,
        duration_days: parseInt(formData.duration_days),
        quantity: parseInt(formData.quantity),
        refills_allowed: parseInt(formData.refills_allowed),
        refills_remaining: parseInt(formData.refills_allowed),
        instructions: formData.instructions || null,
        warnings: formData.warnings || null,
        status: 'approved',
        specialist_country: specialist.license_country,
        patient_country: patientProfile?.country || 'Unknown',
        expires_at: new Date(Date.now() + parseInt(formData.duration_days) * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Prescription created successfully',
      });

      navigate(`/appointments/${appointmentId}`);
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create prescription',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout 
      title="Create Prescription"
      description="Fill in the prescription details for your patient"
    >
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Prescription</CardTitle>
            <CardDescription>
              Fill in the prescription details for your patient
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medication_name">Medication Name *</Label>
                  <Input
                    id="medication_name"
                    value={formData.medication_name}
                    onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="generic_name">Generic Name</Label>
                  <Input
                    id="generic_name"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage *</Label>
                  <Input
                    id="dosage"
                    placeholder="e.g., 500mg"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Input
                    id="frequency"
                    placeholder="e.g., Twice daily"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_days">Duration (days) *</Label>
                  <Input
                    id="duration_days"
                    type="number"
                    min="1"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refills_allowed">Refills Allowed</Label>
                  <Input
                    id="refills_allowed"
                    type="number"
                    min="0"
                    value={formData.refills_allowed}
                    onChange={(e) => setFormData({ ...formData, refills_allowed: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Detailed instructions for the patient..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warnings">Warnings & Precautions</Label>
                <Textarea
                  id="warnings"
                  placeholder="Any warnings or precautions..."
                  value={formData.warnings}
                  onChange={(e) => setFormData({ ...formData, warnings: e.target.value })}
                  rows={3}
                />
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
                  {loading ? 'Creating...' : 'Create Prescription'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
