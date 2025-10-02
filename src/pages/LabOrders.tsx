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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlaskConical, FileImage } from 'lucide-react';

interface LabOrder {
  id: string;
  order_number: string;
  order_type: string;
  test_names: string[];
  priority: string;
  status: string;
  clinical_notes?: string;
  created_at: string;
  ordered_at: string;
}

export default function LabOrders() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    order_type: 'lab',
    test_codes: '',
    test_names: '',
    priority: 'routine',
    clinical_notes: '',
  });

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      if (profile?.role === 'specialist') {
        const { data: specialist } = await supabase
          .from('specialists')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (!specialist) return;

        const { data, error } = await supabase
          .from('lab_orders')
          .select('*')
          .eq('specialist_id', specialist.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } else if (profile?.role === 'patient') {
        const { data, error } = await supabase
          .from('lab_orders')
          .select('*')
          .eq('patient_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!specialist) throw new Error('Specialist profile not found');

      const testCodesArray = formData.test_codes.split(',').map(t => t.trim());
      const testNamesArray = formData.test_names.split(',').map(t => t.trim());

      const { error } = await supabase.from('lab_orders').insert({
        patient_id: formData.patient_id,
        specialist_id: specialist.id,
        order_type: formData.order_type,
        test_codes: testCodesArray,
        test_names: testNamesArray,
        priority: formData.priority,
        clinical_notes: formData.clinical_notes || null,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Order created successfully',
      });

      setIsCreateDialogOpen(false);
      setFormData({
        patient_id: '',
        order_type: 'lab',
        test_codes: '',
        test_names: '',
        priority: 'routine',
        clinical_notes: '',
      });
      loadOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create order',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resulted': return 'default';
      case 'processing': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return 'destructive';
      case 'urgent': return 'default';
      default: return 'secondary';
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
            <h1 className="text-3xl font-bold">Lab & Imaging Orders</h1>
            <p className="text-muted-foreground">Manage diagnostic orders and results</p>
          </div>
          {profile?.role === 'specialist' && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Lab or Imaging Order</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateOrder} className="space-y-4">
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
                    <Label htmlFor="order_type">Order Type</Label>
                    <Select value={formData.order_type} onValueChange={(value) => setFormData({ ...formData, order_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lab">Laboratory</SelectItem>
                        <SelectItem value="imaging">Imaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test_codes">Test Codes (comma-separated)</Label>
                    <Input
                      id="test_codes"
                      required
                      placeholder="e.g., CBC, CMP, TSH"
                      value={formData.test_codes}
                      onChange={(e) => setFormData({ ...formData, test_codes: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test_names">Test Names (comma-separated)</Label>
                    <Input
                      id="test_names"
                      required
                      placeholder="e.g., Complete Blood Count, Metabolic Panel"
                      value={formData.test_names}
                      onChange={(e) => setFormData({ ...formData, test_names: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="stat">STAT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinical_notes">Clinical Notes</Label>
                    <Textarea
                      id="clinical_notes"
                      value={formData.clinical_notes}
                      onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Order</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No orders found
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {order.order_type === 'lab' ? (
                        <FlaskConical className="h-5 w-5" />
                      ) : (
                        <FileImage className="h-5 w-5" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{order.order_number}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.order_type === 'lab' ? 'Laboratory' : 'Imaging'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Tests:</p>
                      <p className="text-sm text-muted-foreground">{order.test_names.join(', ')}</p>
                    </div>
                    {order.clinical_notes && (
                      <div>
                        <p className="text-sm font-medium">Clinical Notes:</p>
                        <p className="text-sm text-muted-foreground">{order.clinical_notes}</p>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Ordered: {new Date(order.ordered_at).toLocaleDateString()}
                    </div>
                    {order.status === 'resulted' && (
                      <Button className="mt-2">View Results</Button>
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