import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, CheckCircle2, XCircle, RefreshCw, Unlink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CalendarSyncSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    loadProviders();
  }, [user]);

  const loadProviders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('calendar_providers')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectCalendar = async (provider: 'google' | 'outlook') => {
    try {
      const { data, error } = await supabase.functions.invoke('calendar-oauth-init', {
        body: { provider }
      });

      if (error) throw error;

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      console.error('Error connecting calendar:', error);
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect calendar',
        variant: 'destructive'
      });
    }
  };

  const syncNow = async (provider: string) => {
    if (!user) return;

    setSyncing(provider);
    try {
      const { data, error } = await supabase.functions.invoke('calendar-sync-bidirectional', {
        body: { userId: user.id, provider }
      });

      if (error) throw error;

      toast({
        title: 'Sync complete',
        description: `Synced ${data.syncedCount} appointments`
      });

      loadProviders();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSyncing(null);
    }
  };

  const disconnectCalendar = async (providerId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_providers')
        .delete()
        .eq('id', providerId);

      if (error) throw error;

      toast({
        title: 'Calendar disconnected',
        description: 'Your calendar has been disconnected'
      });

      loadProviders();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect calendar',
        variant: 'destructive'
      });
    }
  };

  const calendarOptions = [
    { id: 'google', name: 'Google Calendar', icon: '📅', color: 'bg-blue-500' },
    { id: 'outlook', name: 'Outlook Calendar', icon: '📧', color: 'bg-indigo-500' }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Calendar Sync</h1>
          <p className="text-muted-foreground mt-2">
            Connect your calendar to automatically sync appointments
          </p>
        </div>

        <div className="grid gap-4">
          {calendarOptions.map((option) => {
            const connected = providers.find(p => p.provider === option.id);
            
            return (
              <Card key={option.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${option.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                        {option.icon}
                      </div>
                      <div>
                        <CardTitle>{option.name}</CardTitle>
                        <CardDescription>
                          {connected 
                            ? `Last synced: ${connected.last_sync_at ? new Date(connected.last_sync_at).toLocaleString() : 'Never'}`
                            : 'Not connected'
                          }
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={connected ? 'default' : 'secondary'}>
                      {connected ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Not Connected</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {connected ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Syncing {connected.sync_enabled ? 'enabled' : 'disabled'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => syncNow(option.id)}
                          disabled={syncing === option.id}
                        >
                          {syncing === option.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnectCalendar(connected.id)}
                        >
                          <Unlink className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button onClick={() => connectCalendar(option.id as any)}>
                      Connect {option.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How Calendar Sync Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Appointments are automatically added to your connected calendar</p>
            <p>• Updates and cancellations sync in real-time</p>
            <p>• Your calendar events won't be modified or deleted</p>
            <p>• You can disconnect at any time without affecting existing appointments</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}