import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pill, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export default function PrescriptionRenewals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [pharmacyId, setPharmacyId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load active prescriptions
      const { data: presData } = await supabase
        .from('prescriptions')
        .select(`
          *,
          specialist:specialist_id(id, user_id)
        `)
        .eq('patient_id', user.id)
        .eq('status', 'approved');

      setPrescriptions(presData || []);

      // Load renewal requests
      const { data: renewData } = await supabase
        .from('prescription_renewals')
        .select(`
          *,
          prescription:prescription_id(medication_name, dosage)
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      setRenewals(renewData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPrescriptionId) return;

    setRequesting(true);
    try {
      const { error } = await supabase
        .from('prescription_renewals')
        .insert([{
          prescription_id: selectedPrescriptionId,
          patient_id: user.id,
          pharmacy_id: pharmacyId || null,
          status: 'pending',
          notes
        }]);

      if (error) throw error;

      toast({
        title: 'Renewal requested',
        description: 'Your prescription renewal request has been submitted'
      });

      setSelectedPrescriptionId('');
      setPharmacyId('');
      setNotes('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request renewal',
        variant: 'destructive'
      });
    } finally {
      setRequesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Prescription Renewals</h1>
          <p className="text-muted-foreground mt-2">
            Request prescription refills electronically and track approval status
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Request Renewal
            </CardTitle>
            <CardDescription>
              Submit a renewal request for your active prescriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={requestRenewal} className="space-y-4">
              <div>
                <Label htmlFor="prescription">Select Prescription</Label>
                <Select value={selectedPrescriptionId} onValueChange={setSelectedPrescriptionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a prescription" />
                  </SelectTrigger>
                  <SelectContent>
                    {prescriptions.map((presc) => (
                      <SelectItem key={presc.id} value={presc.id}>
                        {presc.medication_name} - {presc.dosage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pharmacy">Pharmacy (Optional)</Label>
                <Input
                  id="pharmacy"
                  value={pharmacyId}
                  onChange={(e) => setPharmacyId(e.target.value)}
                  placeholder="Enter pharmacy name or leave blank for default"
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information for your provider..."
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={requesting || !selectedPrescriptionId}>
                {requesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Pill className="mr-2 h-4 w-4" />
                Request Renewal
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Renewal History</h2>
          {renewals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No renewal requests yet</p>
                <p className="text-sm text-muted-foreground">
                  Your renewal requests will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {renewals.map((renewal) => (
                <Card key={renewal.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {renewal.prescription?.medication_name}
                          <Badge
                            variant={
                              renewal.status === 'approved'
                                ? 'default'
                                : renewal.status === 'denied'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {getStatusIcon(renewal.status)}
                            <span className="ml-1 capitalize">{renewal.status}</span>
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {renewal.prescription?.dosage}
                        </CardDescription>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(renewal.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  {renewal.notes && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {renewal.notes}
                      </p>
                    </CardContent>
                  )}
                  {renewal.denial_reason && (
                    <CardContent>
                      <div className="bg-destructive/10 p-3 rounded-lg">
                        <p className="text-sm text-destructive">
                          <strong>Denial Reason:</strong> {renewal.denial_reason}
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How Prescription Renewals Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Submit renewal requests directly through the portal</p>
            <p>• Your provider reviews and approves eligible renewals within 4-6 hours</p>
            <p>• Approved prescriptions are sent electronically to your pharmacy</p>
            <p>• You'll receive notifications when your prescription is ready for pickup</p>
            <p>• Track all renewal requests and their status in real-time</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}