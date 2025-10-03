import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Verification {
  id: string;
  payer_id: string;
  payer_name: string;
  plan_types: string[];
  verified_at: string;
  expires_at: string | null;
  is_active: boolean;
  last_checked: string;
}

function InsuranceManagementContent() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newVerification, setNewVerification] = useState({
    payer_id: '',
    payer_name: '',
    plan_types: '',
    expires_at: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSpecialist();
  }, []);

  useEffect(() => {
    if (specialistId) {
      loadVerifications();
    }
  }, [specialistId]);

  const loadSpecialist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      setSpecialistId(data?.id || null);
    } catch (error) {
      console.error('Error loading specialist:', error);
    }
  };

  const loadVerifications = async () => {
    if (!specialistId) return;
    
    try {
      const { data, error } = await supabase
        .from('insurance_verifications' as any)
        .select('*')
        .eq('specialist_id', specialistId)
        .order('verified_at', { ascending: false });

      if (error) throw error;
      setVerifications((data || []) as any);
    } catch (error: any) {
      toast({
        title: 'Error loading verifications',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVerification = async () => {
    if (!specialistId || !newVerification.payer_id || !newVerification.payer_name) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const planTypesArray = newVerification.plan_types
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from('insurance_verifications' as any)
        .insert({
          specialist_id: specialistId,
          payer_id: newVerification.payer_id,
          payer_name: newVerification.payer_name,
          plan_types: planTypesArray,
          verified_by: user.id,
          expires_at: newVerification.expires_at || null,
          verification_method: 'manual'
        });

      if (error) throw error;

      toast({
        title: 'Insurance verified',
        description: 'Insurance panel has been added successfully',
      });

      setIsDialogOpen(false);
      setNewVerification({ payer_id: '', payer_name: '', plan_types: '', expires_at: '' });
      loadVerifications();
    } catch (error: any) {
      toast({
        title: 'Error adding verification',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('insurance_verifications' as any)
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Insurance removed',
        description: 'Insurance panel has been deactivated',
      });

      loadVerifications();
    } catch (error: any) {
      toast({
        title: 'Error removing verification',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  };

  return (
    <DashboardLayout>
      <div className="container-modern py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8" />
                Insurance Panel Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your accepted insurance plans and verifications
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Insurance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Insurance Verification</DialogTitle>
                  <DialogDescription>
                    Add a new insurance provider to your accepted panel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Payer ID</Label>
                    <Input
                      placeholder="e.g., BCBS001"
                      value={newVerification.payer_id}
                      onChange={(e) => setNewVerification({ ...newVerification, payer_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Payer Name</Label>
                    <Input
                      placeholder="e.g., Blue Cross Blue Shield"
                      value={newVerification.payer_name}
                      onChange={(e) => setNewVerification({ ...newVerification, payer_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Plan Types (comma-separated)</Label>
                    <Input
                      placeholder="e.g., PPO, HMO, POS"
                      value={newVerification.plan_types}
                      onChange={(e) => setNewVerification({ ...newVerification, plan_types: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Expiration Date (Optional)</Label>
                    <Input
                      type="date"
                      value={newVerification.expires_at}
                      onChange={(e) => setNewVerification({ ...newVerification, expires_at: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddVerification} className="w-full">
                    Add Verification
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading insurance verifications...
              </CardContent>
            </Card>
          ) : verifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Insurance Verifications</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first insurance provider to start accepting patients
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Insurance
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification) => (
                <Card key={verification.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {verification.payer_name}
                          {verification.is_active ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                          {verification.expires_at && isExpiringSoon(verification.expires_at) && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Expiring Soon
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>Payer ID: {verification.payer_id}</CardDescription>
                      </div>
                      {verification.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(verification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Plan Types:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {verification.plan_types.map((type, idx) => (
                          <Badge key={idx} variant="outline">{type}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Verified:</p>
                        <p>{new Date(verification.verified_at).toLocaleDateString()}</p>
                      </div>
                      {verification.expires_at && (
                        <div>
                          <p className="text-muted-foreground">Expires:</p>
                          <p>{new Date(verification.expires_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last checked: {new Date(verification.last_checked).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function InsuranceManagement() {
  return (
    <ProtectedRoute allowedRoles={['specialist']}>
      <InsuranceManagementContent />
    </ProtectedRoute>
  );
}
