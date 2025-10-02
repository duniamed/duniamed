import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Shield, XCircle } from 'lucide-react';

interface ProxyAuthorization {
  id: string;
  proxy_name: string;
  proxy_email: string;
  relationship: string;
  access_scope: any;
  start_date: string;
  end_date?: string;
  status: string;
}

export default function ProxyAccess() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [proxies, setProxies] = useState<ProxyAuthorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    proxy_name: '',
    proxy_email: '',
    proxy_user_id: '',
    relationship: '',
    end_date: '',
    appointments: true,
    records: true,
    messaging: true,
    prescriptions: false,
  });

  useEffect(() => {
    loadProxies();
  }, [user]);

  const loadProxies = async () => {
    try {
      const { data, error } = await supabase
        .from('proxy_authorizations')
        .select('*')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProxies(data || []);
    } catch (error) {
      console.error('Error loading proxies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load proxy authorizations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('proxy_authorizations').insert({
        patient_id: user?.id,
        proxy_user_id: formData.proxy_user_id,
        proxy_name: formData.proxy_name,
        proxy_email: formData.proxy_email,
        relationship: formData.relationship,
        end_date: formData.end_date || null,
        access_scope: {
          appointments: formData.appointments,
          records: formData.records,
          messaging: formData.messaging,
          prescriptions: formData.prescriptions,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Proxy authorization created successfully',
      });

      setIsCreateDialogOpen(false);
      setFormData({
        proxy_name: '',
        proxy_email: '',
        proxy_user_id: '',
        relationship: '',
        end_date: '',
        appointments: true,
        records: true,
        messaging: true,
        prescriptions: false,
      });
      loadProxies();
    } catch (error) {
      console.error('Error creating proxy:', error);
      toast({
        title: 'Error',
        description: 'Failed to create proxy authorization',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeProxy = async (proxyId: string) => {
    try {
      const { error } = await supabase
        .from('proxy_authorizations')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: user?.id,
        })
        .eq('id', proxyId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Proxy authorization revoked',
      });

      loadProxies();
    } catch (error) {
      console.error('Error revoking proxy:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke proxy authorization',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'revoked': return 'destructive';
      case 'expired': return 'secondary';
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
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Proxy & Caregiver Access</h1>
              <p className="text-muted-foreground">Manage who can access your health information</p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Proxy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Grant Proxy Access</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProxy} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="proxy_name">Proxy Name</Label>
                  <Input
                    id="proxy_name"
                    required
                    value={formData.proxy_name}
                    onChange={(e) => setFormData({ ...formData, proxy_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxy_email">Proxy Email</Label>
                  <Input
                    id="proxy_email"
                    type="email"
                    required
                    value={formData.proxy_email}
                    onChange={(e) => setFormData({ ...formData, proxy_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxy_user_id">Proxy User ID</Label>
                  <Input
                    id="proxy_user_id"
                    required
                    value={formData.proxy_user_id}
                    onChange={(e) => setFormData({ ...formData, proxy_user_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Access End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Access Permissions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="appointments">Appointments</Label>
                      <Switch
                        id="appointments"
                        checked={formData.appointments}
                        onCheckedChange={(checked) => setFormData({ ...formData, appointments: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="records">Medical Records</Label>
                      <Switch
                        id="records"
                        checked={formData.records}
                        onCheckedChange={(checked) => setFormData({ ...formData, records: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="messaging">Messaging</Label>
                      <Switch
                        id="messaging"
                        checked={formData.messaging}
                        onCheckedChange={(checked) => setFormData({ ...formData, messaging: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prescriptions">Prescriptions</Label>
                      <Switch
                        id="prescriptions"
                        checked={formData.prescriptions}
                        onCheckedChange={(checked) => setFormData({ ...formData, prescriptions: checked })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Grant Access</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {proxies.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No proxy authorizations
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {proxies.map((proxy) => (
              <Card key={proxy.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{proxy.proxy_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {proxy.proxy_email} • {proxy.relationship}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(proxy.status)}>
                      {proxy.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Access Permissions:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {proxy.access_scope.appointments && <Badge variant="outline">Appointments</Badge>}
                        {proxy.access_scope.records && <Badge variant="outline">Records</Badge>}
                        {proxy.access_scope.messaging && <Badge variant="outline">Messaging</Badge>}
                        {proxy.access_scope.prescriptions && <Badge variant="outline">Prescriptions</Badge>}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Started: {new Date(proxy.start_date).toLocaleDateString()}
                      {proxy.end_date && ` • Expires: ${new Date(proxy.end_date).toLocaleDateString()}`}
                    </div>
                    {proxy.status === 'active' && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRevokeProxy(proxy.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Revoke Access
                      </Button>
                    )}
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