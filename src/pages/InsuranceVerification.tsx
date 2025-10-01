import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Shield, CheckCircle2, XCircle, AlertCircle, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface InsuranceVerification {
  id: string;
  insurance_network: string;
  insurance_provider: string;
  verification_status: string;
  verified_at: string | null;
  expires_at: string | null;
  last_checked: string;
  notes: string;
}

export default function InsuranceVerification() {
  const [verifications, setVerifications] = useState<InsuranceVerification[]>([]);
  const [newVerification, setNewVerification] = useState({
    insurance_network: '',
    insurance_provider: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) return;

      const { data, error } = await supabase
        .from('insurance_verifications')
        .select('*')
        .eq('specialist_id', specialist.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) return;

      const { error } = await supabase
        .from('insurance_verifications')
        .insert({
          specialist_id: specialist.id,
          ...newVerification,
          verification_status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Insurance added',
        description: 'Insurance verification request submitted',
      });

      setIsDialogOpen(false);
      setNewVerification({
        insurance_network: '',
        insurance_provider: '',
        notes: '',
      });
      loadVerifications();
    } catch (error: any) {
      toast({
        title: 'Error adding insurance',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'expired':
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default">Verified</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'invalid':
        return <Badge variant="destructive">Invalid</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading insurance verifications...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Insurance Verification</h1>
            </div>
            <p className="text-muted-foreground">
              Manage and verify your insurance panel participation
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
                <DialogTitle>Add Insurance Panel</DialogTitle>
                <DialogDescription>
                  Add an insurance provider to request verification
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Insurance Network</Label>
                  <Input
                    placeholder="e.g., Blue Cross Blue Shield"
                    value={newVerification.insurance_network}
                    onChange={(e) => setNewVerification({ ...newVerification, insurance_network: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Insurance Provider</Label>
                  <Input
                    placeholder="e.g., BCBS Michigan"
                    value={newVerification.insurance_provider}
                    onChange={(e) => setNewVerification({ ...newVerification, insurance_provider: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Input
                    placeholder="Provider ID, group number, etc."
                    value={newVerification.notes}
                    onChange={(e) => setNewVerification({ ...newVerification, notes: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddVerification} className="w-full">
                  Submit for Verification
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {verifications.filter(v => v.verification_status === 'verified').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {verifications.filter(v => v.verification_status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {verifications.filter(v => v.verification_status === 'expired').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {verifications.filter(v => isExpiringSoon(v.expires_at)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {verifications.map((verification) => (
            <Card key={verification.id} className={
              verification.verification_status === 'expired' ? 'border-red-500' :
              isExpiringSoon(verification.expires_at) ? 'border-orange-500' : ''
            }>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(verification.verification_status)}
                    <div>
                      <CardTitle className="text-lg">{verification.insurance_network}</CardTitle>
                      <CardDescription>{verification.insurance_provider}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(verification.verification_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {verification.verified_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Verified:</span>
                    <span>{new Date(verification.verified_at).toLocaleDateString()}</span>
                  </div>
                )}

                {verification.expires_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className={isExpiringSoon(verification.expires_at) ? 'text-orange-600 font-semibold' : ''}>
                      {new Date(verification.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Checked:</span>
                  <span>{new Date(verification.last_checked).toLocaleDateString()}</span>
                </div>

                {verification.notes && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{verification.notes}</p>
                  </div>
                )}

                {isExpiringSoon(verification.expires_at) && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      ⚠️ This verification expires soon. Please renew to maintain accuracy.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {verifications.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No insurance verifications yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add your insurance panels to display accurate information to patients
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
