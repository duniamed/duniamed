import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, Trash2, Download, AlertCircle } from 'lucide-react';

/**
 * C15 PRIVACY - Privacy Dashboard Component
 * Patients view access logs, request deletion, see data use summaries
 */

interface DataAccessLog {
  id: string;
  accessor_id: string | null;
  resource_type: string;
  access_type: string;
  purpose: string | null;
  created_at: string;
}

interface DataUseSummary {
  id: string;
  summary_period: string;
  access_count: number;
  shared_with: any[];
  secondary_uses: any[];
}

export function PrivacyDashboard() {
  const [accessLogs, setAccessLogs] = useState<DataAccessLog[]>([]);
  const [dataSummary, setDataSummary] = useState<DataUseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const { toast } = useToast();

  const dataTypes = [
    'medical_records',
    'appointments',
    'prescriptions',
    'messages',
    'payment_info',
    'profile_data'
  ];

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  const fetchPrivacyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch recent access logs
      const { data: logs } = await (supabase as any)
        .from('data_access_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch latest data use summary
      const { data: summary } = await (supabase as any)
        .from('data_use_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setAccessLogs((logs || []) as DataAccessLog[]);
      setDataSummary(summary as DataUseSummary);
    } catch (error) {
      console.error('Error fetching privacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataDeletionRequest = async (requestType: 'anonymize' | 'delete') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from('data_deletion_requests')
        .insert({
          user_id: user.id,
          request_type: requestType,
          data_types: selectedDataTypes,
          reason: 'User requested via privacy dashboard'
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: `Your ${requestType} request has been submitted and will be processed within 30 days.`,
      });

      setSelectedDataTypes([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit deletion request",
        variant: "destructive",
      });
    }
  };

  const exportAccessLogs = async () => {
    try {
      const csv = [
        ['Date', 'Resource Type', 'Access Type', 'Purpose'],
        ...accessLogs.map(log => [
          new Date(log.created_at).toLocaleString(),
          log.resource_type,
          log.access_type,
          log.purpose || 'N/A'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `access-logs-${new Date().toISOString()}.csv`;
      a.click();

      toast({
        title: "Export Complete",
        description: "Your access logs have been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export access logs",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading privacy data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Data Use Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Data Use Summary
          </CardTitle>
          <CardDescription>
            Overview of how your data has been accessed and used
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dataSummary ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Badge>{dataSummary.summary_period}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Accesses:</span>
                <span className="font-semibold">{dataSummary.access_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Shared With:</span>
                <span className="font-semibold">{dataSummary.shared_with?.length || 0} entities</span>
              </div>
              {dataSummary.secondary_uses && dataSummary.secondary_uses.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Secondary Data Uses</p>
                      <ul className="text-sm text-muted-foreground mt-1">
                        {dataSummary.secondary_uses.map((use: any, idx: number) => (
                          <li key={idx}>• {use.purpose || 'Research/Analytics'}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data summary available yet</p>
          )}
        </CardContent>
      </Card>

      {/* Access Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Access Logs
              </CardTitle>
              <CardDescription>
                Recent access to your protected health information
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportAccessLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {accessLogs.length > 0 ? (
              accessLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{log.resource_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.access_type} • {new Date(log.created_at).toLocaleString()}
                    </p>
                    {log.purpose && (
                      <p className="text-xs text-muted-foreground">Purpose: {log.purpose}</p>
                    )}
                  </div>
                  <Badge variant="outline">{log.access_type}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No access logs to display
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Deletion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Data Rights
          </CardTitle>
          <CardDescription>
            Request deletion or anonymization of your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Select data to delete:</p>
            {dataTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={selectedDataTypes.includes(type)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedDataTypes([...selectedDataTypes, type]);
                    } else {
                      setSelectedDataTypes(selectedDataTypes.filter(t => t !== type));
                    }
                  }}
                />
                <label htmlFor={type} className="text-sm capitalize cursor-pointer">
                  {type.replace('_', ' ')}
                </label>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={selectedDataTypes.length === 0}>
                  Anonymize Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Anonymize Selected Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove personally identifiable information while preserving data for research.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDataDeletionRequest('anonymize')}>
                    Confirm Anonymization
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={selectedDataTypes.length === 0}>
                  Delete Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Selected Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the selected data types. Legal retention requirements
                    may prevent immediate deletion. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDataDeletionRequest('delete')}>
                    Confirm Deletion
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: Deletion requests are processed within 30 days. Some data may be retained for legal
            compliance (HIPAA, billing, etc.).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
