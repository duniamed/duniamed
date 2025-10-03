import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Shield, UserCheck, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Complaint {
  id: string;
  ticket_number: string;
  title: string;
  complaint_type: string;
  severity: string;
  status: string;
  mediation_status: string | null;
  assigned_mediator: string | null;
  created_at: string;
  filed_by: string;
  filed_against: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

function ComplaintManagementContent() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [mediators, setMediators] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [assignedMediator, setAssignedMediator] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadComplaints();
    loadMediators();
  }, []);

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints((data || []) as any);
    } catch (error: any) {
      toast({
        title: 'Error loading complaints',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMediators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'specialist');

      if (error) throw error;
      setMediators((data || []) as Profile[]);
    } catch (error: any) {
      console.error('Error loading mediators:', error);
    }
  };

  const handleAssignMediator = async () => {
    if (!selectedComplaint || !assignedMediator) return;

    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          assigned_mediator: assignedMediator,
          mediation_status: 'in_progress',
          status: 'under_review',
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      // Send notification to mediator
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: assignedMediator,
          type: 'mediator_assigned',
          title: 'New Mediation Case',
          message: `You've been assigned to mediate complaint ${selectedComplaint.ticket_number}`,
          data: { complaintId: selectedComplaint.id },
        },
      });

      toast({
        title: 'Mediator assigned',
        description: 'The mediator has been notified',
      });

      setSelectedComplaint(null);
      setAssignedMediator('');
      loadComplaints();
    } catch (error: any) {
      toast({
        title: 'Error assigning mediator',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleResolveComplaint = async () => {
    if (!selectedComplaint || !resolutionNotes) return;

    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: 'resolved',
          mediation_status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      // Notify both parties
      await Promise.all([
        supabase.functions.invoke('send-notification', {
          body: {
            userId: selectedComplaint.filed_by,
            type: 'complaint_resolved',
            title: 'Complaint Resolved',
            message: `Your complaint ${selectedComplaint.ticket_number} has been resolved`,
            data: { complaintId: selectedComplaint.id },
          },
        }),
        supabase.functions.invoke('send-notification', {
          body: {
            userId: selectedComplaint.filed_against,
            type: 'complaint_resolved',
            title: 'Complaint Resolved',
            message: `The complaint ${selectedComplaint.ticket_number} filed against you has been resolved`,
            data: { complaintId: selectedComplaint.id },
          },
        }),
      ]);

      toast({
        title: 'Complaint resolved',
        description: 'Both parties have been notified',
      });

      setSelectedComplaint(null);
      setResolutionNotes('');
      loadComplaints();
    } catch (error: any) {
      toast({
        title: 'Error resolving complaint',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
    };
    return <Badge variant={variants[severity] || 'default'}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      open: 'destructive',
      under_review: 'default',
      resolved: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container-modern py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Complaint Management</h1>
              <p className="text-muted-foreground">Assign mediators and manage complaint resolution</p>
            </div>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading complaints...
              </CardContent>
            </Card>
          ) : complaints.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Complaints</h3>
                <p className="text-muted-foreground">There are no complaints to manage at this time</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <Card key={complaint.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {complaint.title}
                          {getStatusBadge(complaint.status)}
                          {getSeverityBadge(complaint.severity)}
                        </CardTitle>
                        <CardDescription>
                          Ticket: {complaint.ticket_number} • Filed on{' '}
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedComplaint(complaint)}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage Complaint</DialogTitle>
                            <DialogDescription>
                              Assign mediator or resolve complaint {complaint.ticket_number}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Assign Mediator</Label>
                              <Select value={assignedMediator} onValueChange={setAssignedMediator}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a mediator" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mediators.map((mediator) => (
                                    <SelectItem key={mediator.id} value={mediator.id}>
                                      {mediator.first_name} {mediator.last_name} ({mediator.email})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                onClick={handleAssignMediator}
                                disabled={!assignedMediator}
                                className="w-full mt-2"
                              >
                                Assign Mediator
                              </Button>
                            </div>

                            <div className="border-t pt-4">
                              <Label>Resolution Notes</Label>
                              <Textarea
                                placeholder="Enter resolution details..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                rows={4}
                              />
                              <Button
                                onClick={handleResolveComplaint}
                                disabled={!resolutionNotes}
                                className="w-full mt-2"
                                variant="default"
                              >
                                Mark as Resolved
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type:</p>
                        <p className="font-medium">{complaint.complaint_type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mediation Status:</p>
                        <p className="font-medium">{complaint.mediation_status || 'Not started'}</p>
                      </div>
                    </div>
                    {complaint.assigned_mediator && (
                      <Badge variant="outline" className="mt-2">
                        <Users className="h-3 w-3 mr-1" />
                        Mediator Assigned
                      </Badge>
                    )}
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

export default function ComplaintManagement() {
  return (
    <ProtectedRoute allowedRoles={['clinic_admin']}>
      <ComplaintManagementContent />
    </ProtectedRoute>
  );
}
