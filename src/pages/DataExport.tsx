import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DataExport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    include_appointments: true,
    include_medical_records: true,
    include_prescriptions: true,
    data_format: 'fhir_json',
  });

  useEffect(() => {
    loadRequests();
  }, [user]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('data_portability_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('data_portability_requests').insert({
        user_id: user?.id,
        request_type: 'export',
        include_appointments: formData.include_appointments,
        include_medical_records: formData.include_medical_records,
        include_prescriptions: formData.include_prescriptions,
        data_format: formData.data_format,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Export Requested',
        description: 'Your data export will be ready shortly. You will receive a notification when complete.',
      });

      loadRequests();
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to request export',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Download className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Data Export</h1>
            <p className="text-muted-foreground">Export your health data for portability (HIPAA Right of Access)</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request Data Export</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleExport} className="space-y-4">
              <div className="space-y-3">
                <Label>What to Include</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="appointments">Appointments</Label>
                    <Switch
                      id="appointments"
                      checked={formData.include_appointments}
                      onCheckedChange={(checked) => setFormData({ ...formData, include_appointments: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="records">Medical Records</Label>
                    <Switch
                      id="records"
                      checked={formData.include_medical_records}
                      onCheckedChange={(checked) => setFormData({ ...formData, include_medical_records: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prescriptions">Prescriptions</Label>
                    <Switch
                      id="prescriptions"
                      checked={formData.include_prescriptions}
                      onCheckedChange={(checked) => setFormData({ ...formData, include_prescriptions: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={formData.data_format} onValueChange={(value) => setFormData({ ...formData, data_format: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fhir_json">FHIR JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Processing...' : 'Request Export'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {requests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Export History</h2>
            {requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{request.data_format.toUpperCase()} Export</p>
                        {request.status === 'completed' && (
                          <Badge className="gap-1"><CheckCircle className="h-3 w-3" /> Complete</Badge>
                        )}
                        {request.status === 'pending' && (
                          <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Processing</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Requested: {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    {request.export_url && request.status === 'completed' && (
                      <Button size="sm" asChild>
                        <a href={request.export_url} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
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
