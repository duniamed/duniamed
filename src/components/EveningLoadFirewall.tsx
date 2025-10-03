import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Clock, Moon, Sun, Shield, Inbox, TrendingDown,
  CheckCircle, AlertTriangle, Timer, BarChart3
} from 'lucide-react';

interface WorkQueueItem {
  id: string;
  item_type: string;
  urgency: string;
  topic: string;
  requires_md_review: boolean;
  status: string;
  created_at: string;
}

interface EveningMetrics {
  after_hours_minutes: number;
  inbox_time_minutes: number;
  items_closed: number;
  inbox_half_life_hours: number;
}

export default function EveningLoadFirewall() {
  const [workItems, setWorkItems] = useState<WorkQueueItem[]>([]);
  const [metrics, setMetrics] = useState<EveningMetrics | null>(null);
  const [isQuietHours, setIsQuietHours] = useState(false);
  const [batchedCount, setBatchedCount] = useState(0);

  useEffect(() => {
    loadWorkQueue();
    loadMetrics();
    checkQuietHours();

    // Real-time subscription for work queue items
    const queueChannel = supabase
      .channel('work-queue-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'work_queue_items'
      }, (payload) => {
        console.log('New work item:', payload.new);
        loadWorkQueue();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'work_queue_items'
      }, (payload) => {
        console.log('Work item updated:', payload.new);
        loadWorkQueue();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscription active for work queue');
        }
      });

    // Check quiet hours every minute
    const interval = setInterval(checkQuietHours, 60000);

    return () => {
      supabase.removeChannel(queueChannel);
      clearInterval(interval);
    };
  }, []);

  const checkQuietHours = () => {
    const now = new Date();
    const hour = now.getHours();
    // Quiet hours: 6pm - 8am
    setIsQuietHours(hour >= 18 || hour < 8);
  };

  const loadWorkQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's clinic
      const { data: staffRecord } = await supabase
        .from('clinic_staff')
        .select('clinic_id')
        .eq('user_id', user.id)
        .single();

      if (!staffRecord) return;

      // Get work queues for clinic
      const { data: queues } = await supabase
        .from('work_queues')
        .select('id')
        .eq('clinic_id', staffRecord.clinic_id)
        .eq('is_active', true);

      if (!queues || queues.length === 0) return;

      // Get queue items
      const { data: items } = await supabase
        .from('work_queue_items')
        .select('*')
        .in('queue_id', queues.map(q => q.id))
        .in('status', ['pending', 'assigned', 'in_progress'])
        .order('urgency', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(20);

      setWorkItems(items || []);

      // Get batched items count
      const { data: batches } = await supabase
        .from('message_batches')
        .select('message_ids')
        .eq('clinic_id', staffRecord.clinic_id)
        .eq('status', 'pending');

      if (batches) {
        const total = batches.reduce((sum, batch) => {
          const ids = batch.message_ids as any[];
          return sum + (ids?.length || 0);
        }, 0);
        setBatchedCount(total);
      }
    } catch (error: any) {
      console.error('Error loading work queue:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('manage-work-queue', {
        body: { action: 'get_metrics' }
      });

      if (error) throw error;

      setMetrics(data.metrics);
    } catch (error: any) {
      console.error('Error loading metrics:', error);
    }
  };

  const claimItem = async (itemId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-work-queue', {
        body: { action: 'claim_item', itemId }
      });

      if (error) throw error;

      toast.success('Item claimed successfully');
      loadWorkQueue();
    } catch (error: any) {
      toast.error('Failed to claim item: ' + error.message);
    }
  };

  const completeItem = async (itemId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-work-queue', {
        body: { action: 'complete_item', itemId }
      });

      if (error) throw error;

      toast.success('Item completed');
      loadWorkQueue();
      loadMetrics();
    } catch (error: any) {
      toast.error('Failed to complete item');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'routine': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Evening Load Firewall
            </h2>
            <p className="text-muted-foreground mt-1">
              Intelligent message routing to prevent after-hours work overload
            </p>
          </div>
          <Badge variant={isQuietHours ? 'default' : 'secondary'} className="text-sm">
            {isQuietHours ? (
              <><Moon className="h-3 w-3 mr-1" /> Quiet Hours Active</>
            ) : (
              <><Sun className="h-3 w-3 mr-1" /> Business Hours</>
            )}
          </Badge>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">After Hours</p>
                <p className="text-2xl font-bold">{metrics?.after_hours_minutes || 0} min</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inbox Time</p>
                <p className="text-2xl font-bold">{metrics?.inbox_time_minutes || 0} min</p>
              </div>
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Items Closed</p>
                <p className="text-2xl font-bold">{metrics?.items_closed || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Half-Life</p>
                <p className="text-2xl font-bold">{metrics?.inbox_half_life_hours || 0}h</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
        </div>

        {/* Batched Messages Alert */}
        {batchedCount > 0 && (
          <Card className="p-4 mb-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  {batchedCount} messages batched for next business day
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  These routine messages will be processed tomorrow during business hours to protect your evening time.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Work Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Active Work Queue
            </h3>
            <Badge variant="outline">
              {workItems.length} items
            </Badge>
          </div>

          {workItems.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <p className="text-lg font-medium mb-2">All caught up!</p>
              <p className="text-muted-foreground">
                No pending items in your work queue
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {workItems.map(item => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getUrgencyColor(item.urgency)}>
                          {item.urgency}
                        </Badge>
                        <Badge variant="outline">{item.item_type}</Badge>
                        {item.requires_md_review && (
                          <Badge variant="default" className="bg-blue-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            MD Review Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">{item.topic}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => claimItem(item.id)}
                        >
                          Claim
                        </Button>
                      )}
                      {(item.status === 'assigned' || item.status === 'in_progress') && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => completeItem(item.id)}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium mb-1">How the Evening Load Firewall Works</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>AI classifies incoming messages by urgency and topic</li>
                <li>Routine items are batched for next-day processing during quiet hours</li>
                <li>Urgent items route immediately to appropriate clinical staff</li>
                <li>Work queue distributes tasks fairly across team with skill-based routing</li>
                <li>Metrics track after-hours burden and inbox health</li>
                <li>Auto-responses manage patient expectations with clear timelines</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}