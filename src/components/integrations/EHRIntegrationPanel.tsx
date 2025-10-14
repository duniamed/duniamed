import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database, RefreshCw, Download, Upload } from 'lucide-react';

export const EHRIntegrationPanel = () => {
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const { toast } = useToast();

  const syncEpicFHIR = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('epic-fhir-sync', {
        body: { 
          action: 'sync',
          resourceTypes: ['Patient', 'Appointment', 'Observation']
        }
      });
      
      if (error) throw error;
      setSyncStatus(data);
      toast({ title: 'Sync complete', description: `${data.records_synced} records updated` });
    } catch (error: any) {
      toast({ title: 'Sync failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          EHR Integration
        </CardTitle>
        <CardDescription>Epic FHIR synchronization and data exchange</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={syncEpicFHIR} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Epic FHIR
          </Button>
          <Button variant="outline" disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Export Bundle
          </Button>
        </div>

        {syncStatus && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Records Synced</span>
              <Badge>{syncStatus.records_synced}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={syncStatus.status === 'success' ? 'default' : 'destructive'}>
                {syncStatus.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Last Sync</span>
              <span className="text-sm text-muted-foreground">
                {new Date(syncStatus.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
