import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  FileText,
  ArrowUpCircle 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Complaint {
  id: string;
  complaint_type: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  ticket_number: string;
  filed_by: string;
  filed_against: string;
  against_type: string;
  escalated_to_board: boolean;
  created_at: string;
  resolved_at: string | null;
}

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [newComplaint, setNewComplaint] = useState({
    complaint_type: '',
    title: '',
    description: '',
    severity: 'medium',
    filed_against: '',
    against_type: 'specialist',
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .or(`filed_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
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

  const handleSubmitComplaint = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('complaints')
        .insert({
          ...newComplaint,
          filed_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Complaint filed successfully',
        description: 'Your complaint has been submitted and assigned a ticket number',
      });

      setIsDialogOpen(false);
      setNewComplaint({
        complaint_type: '',
        title: '',
        description: '',
        severity: 'medium',
        filed_against: '',
        against_type: 'specialist',
      });
      loadComplaints();
    } catch (error: any) {
      toast({
        title: 'Error filing complaint',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'escalated':
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'investigating':
      case 'mediation':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading complaints...</p>
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
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Formal Complaints</h1>
            </div>
            <p className="text-muted-foreground">
              File and track formal complaints with full transparency
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <AlertTriangle className="h-4 w-4 mr-2" />
                File Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>File a Formal Complaint</DialogTitle>
                <DialogDescription>
                  Submit a formal complaint that will be tracked and investigated
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Complaint Type</Label>
                  <Select
                    value={newComplaint.complaint_type}
                    onValueChange={(value) => setNewComplaint({ ...newComplaint, complaint_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_quality">Service Quality</SelectItem>
                      <SelectItem value="billing">Billing Issue</SelectItem>
                      <SelectItem value="medical_outcome">Medical Outcome</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="availability">Availability</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Severity</Label>
                  <Select
                    value={newComplaint.severity}
                    onValueChange={(value) => setNewComplaint({ ...newComplaint, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="Brief summary of the complaint"
                    value={newComplaint.title}
                    onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Detailed description of the complaint..."
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                    rows={6}
                  />
                </div>

                <Button onClick={handleSubmitComplaint} className="w-full">
                  Submit Complaint
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(complaint.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{complaint.title}</CardTitle>
                        <Badge variant={getSeverityColor(complaint.severity)}>
                          {complaint.severity}
                        </Badge>
                        <Badge variant="outline">
                          {complaint.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Ticket: {complaint.ticket_number} • Filed {new Date(complaint.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>

                  {complaint.escalated_to_board && (
                    <Badge className="bg-red-600">
                      <ArrowUpCircle className="h-3 w-3 mr-1" />
                      Escalated to Medical Board
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Type:</h4>
                  <p className="text-sm capitalize">{complaint.complaint_type.replace('_', ' ')}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-1">Description:</h4>
                  <p className="text-sm">{complaint.description}</p>
                </div>

                {complaint.resolved_at && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      ✓ Resolved on {new Date(complaint.resolved_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Messages
                </Button>
              </CardContent>
            </Card>
          ))}

          {complaints.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No complaints filed</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
