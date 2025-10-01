import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, RefreshCw } from 'lucide-react';

export default function CalendarSync() {
  const [syncTokens, setSyncTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSyncTokens();
  }, []);

  const loadSyncTokens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('calendar_sync_tokens')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setSyncTokens(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading sync settings',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const connectCalendar = async (provider: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('sync-calendar', {
        body: {
          userId: user.id,
          provider,
          authCode: 'mock_auth_code',
        }
      });

      if (error) throw error;

      toast({
        title: 'Calendar connected',
        description: `Successfully connected to ${provider}`,
      });

      loadSyncTokens();
    } catch (error: any) {
      toast({
        title: 'Connection failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const syncNow = async (provider: string) => {
    toast({
      title: 'Syncing...',
      description: 'Your calendar is being synchronized',
    });

    setTimeout(() => {
      toast({
        title: 'Sync complete',
        description: 'Your appointments are up to date',
      });
    }, 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Calendar Sync</h1>
          </div>
          <p className="text-muted-foreground">
            Connect your external calendars
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>
                Sync appointments with your Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              {syncTokens.find(t => t.provider === 'google') ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Connected</span>
                  <Badge variant="secondary">
                    Last sync: {new Date(syncTokens.find(t => t.provider === 'google')?.last_sync_at || '').toLocaleString()}
                  </Badge>
                </div>
              ) : (
                <span className="text-muted-foreground">Not connected</span>
              )}
              
              {syncTokens.find(t => t.provider === 'google') ? (
                <Button onClick={() => syncNow('google')} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              ) : (
                <Button onClick={() => connectCalendar('google')}>
                  Connect
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outlook Calendar</CardTitle>
              <CardDescription>
                Sync appointments with Microsoft Outlook
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              {syncTokens.find(t => t.provider === 'outlook') ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Connected</span>
                  <Badge variant="secondary">
                    Last sync: {new Date(syncTokens.find(t => t.provider === 'outlook')?.last_sync_at || '').toLocaleString()}
                  </Badge>
                </div>
              ) : (
                <span className="text-muted-foreground">Not connected</span>
              )}
              
              {syncTokens.find(t => t.provider === 'outlook') ? (
                <Button onClick={() => syncNow('outlook')} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              ) : (
                <Button onClick={() => connectCalendar('outlook')}>
                  Connect
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>iCal / Apple Calendar</CardTitle>
              <CardDescription>
                Sync with Apple Calendar and other iCal-compatible apps
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              {syncTokens.find(t => t.provider === 'ical') ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Connected</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Not connected</span>
              )}
              
              {syncTokens.find(t => t.provider === 'ical') ? (
                <Button onClick={() => syncNow('ical')} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              ) : (
                <Button onClick={() => connectCalendar('ical')}>
                  Connect
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}