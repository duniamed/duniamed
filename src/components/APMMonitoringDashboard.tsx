import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, AlertTriangle, Info, XCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface MonitoringEvent {
  id: string;
  event_type: string;
  severity: string;
  message: string;
  metadata: any;
  user_id: string;
  created_at: string;
}

export default function APMMonitoringDashboard() {
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    error: 0,
    warning: 0,
    info: 0
  });

  useEffect(() => {
    fetchEvents();
    
    // Real-time subscription
    const channel = supabase
      .channel('monitoring-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'monitoring_events'
      }, (payload) => {
        setEvents(prev => [payload.new as MonitoringEvent, ...prev]);
        updateStats([payload.new as MonitoringEvent]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('monitoring_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEvents(data || []);
      updateStats(data || []);
    } catch (error: any) {
      toast.error('Failed to load monitoring events');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (eventList: MonitoringEvent[]) => {
    const newStats = eventList.reduce((acc, event) => {
      acc.total++;
      acc[event.severity as keyof typeof acc]++;
      return acc;
    }, { total: 0, critical: 0, error: 0, warning: 0, info: 0 });
    
    setStats(newStats);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      critical: 'destructive',
      error: 'destructive',
      warning: 'default',
      info: 'secondary'
    };
    
    return <Badge variant={variants[severity] as any}>{severity.toUpperCase()}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 md:w-8 md:h-8" />
            APM Monitoring Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Application Performance & Security Event Tracking</p>
        </div>
        <Badge variant="outline" className="text-sm md:text-lg px-3 py-1.5 md:px-4 md:py-2">
          <Zap className="w-3 h-3 md:w-4 md:h-4 mr-2" />
          New Relic Connected
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6">
        <Card className="p-3 md:p-4">
          <h3 className="text-xs md:text-sm font-medium mb-1 md:mb-2">Total Events</h3>
          <p className="text-2xl md:text-3xl font-bold">{stats.total}</p>
        </Card>

        <Card className="p-3 md:p-4 border-red-200">
          <h3 className="text-xs md:text-sm font-medium mb-1 md:mb-2 text-red-600">Critical</h3>
          <p className="text-2xl md:text-3xl font-bold text-red-600">{stats.critical}</p>
        </Card>

        <Card className="p-3 md:p-4 border-orange-200">
          <h3 className="text-xs md:text-sm font-medium mb-1 md:mb-2 text-orange-600">Errors</h3>
          <p className="text-2xl md:text-3xl font-bold text-orange-600">{stats.error}</p>
        </Card>

        <Card className="p-3 md:p-4 border-yellow-200">
          <h3 className="text-xs md:text-sm font-medium mb-1 md:mb-2 text-yellow-600">Warnings</h3>
          <p className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.warning}</p>
        </Card>

        <Card className="p-3 md:p-4 border-blue-200">
          <h3 className="text-xs md:text-sm font-medium mb-1 md:mb-2 text-blue-600">Info</h3>
          <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.info}</p>
        </Card>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-2">
          {events.map((event) => (
            <Card key={event.id} className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(event.severity)}
                  <span className="font-semibold text-sm md:text-base">{event.event_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(event.severity)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <p className="text-xs md:text-sm mb-2">{event.message}</p>

              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    View metadata
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto text-[10px] md:text-xs">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
