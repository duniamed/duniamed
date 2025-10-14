import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity, Heart, Droplet, Thermometer } from 'lucide-react';

export const RPMDashboard = ({ patientId }: { patientId: string }) => {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const syncDevice = async (deviceId: string) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-rpm-devices', {
        body: { deviceId, patientId, readings: [] }
      });
      
      if (error) throw error;
      toast({ title: 'Device synced successfully' });
    } catch (error: any) {
      toast({ title: 'Sync failed', description: error.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">72 bpm</div>
          <p className="text-xs text-muted-foreground">Normal range</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">120/80</div>
          <p className="text-xs text-muted-foreground">Optimal</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Blood Glucose</CardTitle>
          <Droplet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">95 mg/dL</div>
          <p className="text-xs text-muted-foreground">Normal fasting</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Temperature</CardTitle>
          <Thermometer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">98.6°F</div>
          <p className="text-xs text-muted-foreground">Normal</p>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>Manage your RPM devices</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={() => syncDevice('device-1')} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync All Devices'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
