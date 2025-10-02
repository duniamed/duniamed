import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, UserPlus, CheckCircle, XCircle } from 'lucide-react';

interface Referral {
  id: string;
  referral_number: string;
  patient_id: string;
  from_specialist_id: string;
  to_specialist_id?: string;
  specialty_requested: string;
  reason: string;
  urgency: string;
  clinical_summary?: string;
  status: string;
  created_at: string;
  patient?: any;
  from_specialist?: any;
  to_specialist?: any;
}

export default function Referrals() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    specialty_requested: '',
    reason: '',
    urgency: 'routine',
    clinical_summary: '',
  });

  useEffect(() => {
    loadReferrals();
  }, [user]);

  const loadReferrals = async () => {
    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!specialist) return;

      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .or(`from_specialist_id.eq.${specialist.id},to_specialist_id.eq.${specialist.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error('Error loading referrals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load referrals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!specialist) throw new Error('Specialist profile not found');

      const { error } = await supabase.from('referrals').insert({
        ...formData,
        from_specialist_id: specialist.id,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Referral created successfully',
      });

      setIsCreateDialogOpen(false);
      setFormData({
        patient_id: '',
        specialty_requested: '',
        reason: '',
        urgency: 'routine',
        clinical_summary: '',
      });
      loadReferrals();
    } catch (error) {
      console.error('Error creating referral:', error);
      toast({
        title: 'Error',
        description: 'Failed to create referral',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptReferral = async (referralId: string) => {
    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!specialist) throw new Error('Specialist profile not found');

      const { error } = await supabase
        .from('referrals')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', referralId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Referral accepted',
      });

      loadReferrals();
    } catch (error) {
      console.error('Error accepting referral:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept referral',
        variant: 'destructive',
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergent': return 'destructive';
      case 'urgent': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'accepted': return 'secondary';
      case 'declined': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Referral Management</h1>
            <p className="text-muted-foreground">Manage specialist-to-specialist referrals</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Referral</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateReferral} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_id">Patient ID</Label>
                  <Input
                    id="patient_id"
                    required
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty_requested">Specialty Requested</Label>
                  <Input
                    id="specialty_requested"
                    required
                    value={formData.specialty_requested}
                    onChange={(e) => setFormData({ ...formData, specialty_requested: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergent">Emergent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Referral</Label>
                  <Textarea
                    id="reason"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinical_summary">Clinical Summary</Label>
                  <Textarea
                    id="clinical_summary"
                    value={formData.clinical_summary}
                    onChange={(e) => setFormData({ ...formData, clinical_summary: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Referral</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {referrals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No referrals found
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {referrals.map((referral) => (
              <Card key={referral.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{referral.referral_number}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Specialty: {referral.specialty_requested}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getUrgencyColor(referral.urgency)}>
                        {referral.urgency}
                      </Badge>
                      <Badge variant={getStatusColor(referral.status)}>
                        {referral.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="text-sm text-muted-foreground">{referral.reason}</p>
                    </div>
                    {referral.clinical_summary && (
                      <div>
                        <p className="text-sm font-medium">Clinical Summary:</p>
                        <p className="text-sm text-muted-foreground">{referral.clinical_summary}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {referral.status === 'pending' && (
                        <>
                          <Button onClick={() => handleAcceptReferral(referral.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept
                          </Button>
                          <Button variant="outline">
                            <XCircle className="mr-2 h-4 w-4" />
                            Decline
                          </Button>
                        </>
                      )}
                      {referral.status === 'accepted' && (
                        <Button onClick={() => navigate(`/appointments/book`)}>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Schedule Appointment
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}