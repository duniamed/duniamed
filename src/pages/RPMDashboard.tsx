import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, Droplet, Weight, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RPMDevice {
  id: string;
  device_type: string;
  device_name?: string;
  is_active: boolean;
  last_sync_at?: string;
}

interface RPMReading {
  id: string;
  reading_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  flagged: boolean;
  flag_reason?: string;
}

export default function RPMDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<RPMDevice[]>([]);
  const [readings, setReadings] = useState<RPMReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevicesAndReadings();
  }, [user]);

  const loadDevicesAndReadings = async () => {
    try {
      const { data: devicesData, error: devicesError } = await supabase
        .from('rpm_devices')
        .select('*')
        .eq('patient_id', user?.id)
        .eq('is_active', true);

      if (devicesError) throw devicesError;
      setDevices(devicesData || []);

      if (devicesData && devicesData.length > 0) {
        const deviceIds = devicesData.map(d => d.id);
        const { data: readingsData, error: readingsError } = await supabase
          .from('rpm_readings')
          .select('*')
          .in('device_id', deviceIds)
          .order('recorded_at', { ascending: false })
          .limit(100);

        if (readingsError) throw readingsError;
        setReadings(readingsData || []);
      }
    } catch (error) {
      console.error('Error loading RPM data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load device data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'blood_pressure':
        return <Activity className="h-5 w-5" />;
      case 'heart_rate':
        return <Heart className="h-5 w-5" />;
      case 'glucose':
        return <Droplet className="h-5 w-5" />;
      case 'weight':
        return <Weight className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getReadingsByType = (type: string) => {
    return readings
      .filter(r => r.reading_type === type)
      .slice(0, 30)
      .reverse()
      .map(r => ({
        date: new Date(r.recorded_at).toLocaleDateString(),
        value: r.value,
      }));
  };

  const getLatestReading = (type: string) => {
    return readings.find(r => r.reading_type === type);
  };

  const getFlaggedReadings = () => {
    return readings.filter(r => r.flagged);
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
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Remote Patient Monitoring</h1>
            <p className="text-muted-foreground">Track your vitals and health metrics</p>
          </div>
        </div>

        {getFlaggedReadings().length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getFlaggedReadings().map((reading) => (
                  <div key={reading.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{reading.reading_type}: {reading.value} {reading.unit}</span>
                    <Badge variant="destructive">{reading.flag_reason}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {devices.map((device) => {
            const latest = getLatestReading(device.device_type);
            return (
              <Card key={device.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {device.device_name || device.device_type.replace('_', ' ')}
                  </CardTitle>
                  {getDeviceIcon(device.device_type)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latest ? `${latest.value} ${latest.unit}` : 'No data'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {device.last_sync_at 
                      ? `Last sync: ${new Date(device.last_sync_at).toLocaleString()}`
                      : 'Never synced'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {devices.map((device) => {
          const chartData = getReadingsByType(device.device_type);
          if (chartData.length === 0) return null;

          return (
            <Card key={device.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {device.device_name || device.device_type.replace('_', ' ')} Trends
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })}

        {devices.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No devices connected</p>
              <Button>Connect Device</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}