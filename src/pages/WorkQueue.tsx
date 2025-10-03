import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Clock, User, AlertCircle, ArrowRight, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkQueueItem {
  id: string;
  queue_id: string;
  item_type: string;
  item_id: string;
  priority?: string;
  status: string;
  assigned_to: string | null;
  metadata?: any;
  sla_due_at?: string | null;
  created_at: string;
  claimed_at?: string | null;
  assigned_at?: string;
  completed_at?: string;
  first_viewed_at?: string;
  requires_md_review?: boolean;
  time_to_completion_minutes?: number;
  time_to_first_view_minutes?: number;
  topic?: string;
  urgency?: string;
  item_url?: string; // Deep link to the item
}

export default function WorkQueue() {
  const [items, setItems] = useState<WorkQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchQueue();
    fetchMetrics();

    // Real-time updates
    const channel = supabase
      .channel('work-queue-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'work_queue_items'
      }, () => {
        console.log('New work item added');
        fetchQueue();
        fetchMetrics();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'work_queue_items'
      }, (payload) => {
        console.log('Work item updated:', payload.new);
        // Update local state optimistically
        setItems(prev => prev.map(item => 
          item.id === payload.new.id ? { ...item, ...payload.new } : item
        ));
        fetchMetrics();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'work_queue_items'
      }, () => {
        fetchQueue();
        fetchMetrics();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-time work queue subscription active');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQueue = async () => {
    try {
      if (!profile) return;

      const { data, error } = await supabase
        .from('work_queue_items')
        .select('*')
        .or(`assigned_to.eq.${profile.id},status.eq.pending`)
        .in('status', ['pending', 'in_progress'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: 'Failed to load queue',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      if (!profile) return;

      const { data, error } = await supabase.functions.invoke('manage-work-queue', {
        body: {
          action: 'get_metrics',
          queue_id: items[0]?.queue_id
        }
      });

      if (error) throw error;
      if (data?.metrics) setMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const claimItem = async (itemId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-work-queue', {
        body: {
          action: 'claim',
          item_id: itemId
        }
      });

      if (error) throw error;

      if (!data?.success) {
        toast({
          title: 'Already claimed',
          description: 'This item was claimed by another user',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Item claimed',
        description: 'You can now work on this item'
      });

      fetchQueue();
    } catch (error: any) {
      toast({
        title: 'Failed to claim',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const completeItem = async (itemId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-work-queue', {
        body: {
          action: 'update_status',
          item_id: itemId,
          status: 'completed',
          notes: 'Completed via work queue'
        }
      });

      if (error) throw error;

      toast({
        title: 'Item completed',
        description: 'Work item marked as complete'
      });

      fetchQueue();
      fetchMetrics();
    } catch (error: any) {
      toast({
        title: 'Failed to complete',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getTimeUntilSLA = (slaDate: string | null) => {
    if (!slaDate) return null;
    const now = Date.now();
    const sla = new Date(slaDate).getTime();
    const diffMinutes = Math.floor((sla - now) / 60000);
    
    if (diffMinutes < 0) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Overdue by {Math.abs(diffMinutes)}m</Badge>;
    } else if (diffMinutes < 60) {
      return <Badge className="bg-orange-500"><Clock className="w-3 h-3 mr-1" />{diffMinutes}m left</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{Math.floor(diffMinutes / 60)}h left</Badge>;
    }
  };

  const pendingItems = items.filter(i => i.status === 'pending' && !i.assigned_to);
  const myItems = items.filter(i => i.assigned_to === profile?.id);

  return (
    <DashboardLayout 
      title="Work Queue"
      description="Manage your clinical workload with real-time updates"
    >
      <div className="space-y-6">
        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.in_progress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{metrics.overdue}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.sla_compliance_rate?.toFixed(0)}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Queue Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Available Items ({pendingItems.length})
              </CardTitle>
              <CardDescription>Unclaimed work items</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {pendingItems.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getPriorityBadge(item.priority)}
                              <Badge variant="outline">{item.item_type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.metadata?.classification?.topic || item.item_type}
                            </p>
                          </div>
                          {item.sla_due_at && getTimeUntilSLA(item.sla_due_at)}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            Created {new Date(item.created_at).toLocaleTimeString()}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => claimItem(item.id)}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Claim
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {pendingItems.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No pending items</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* My Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                My Items ({myItems.length})
              </CardTitle>
              <CardDescription>Items assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {myItems.map((item) => (
                    <Card key={item.id} className="p-4 border-blue-200 dark:border-blue-900">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getPriorityBadge(item.priority)}
                              <Badge>{item.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.metadata?.classification?.topic || item.item_type}
                            </p>
                          </div>
                          {item.sla_due_at && getTimeUntilSLA(item.sla_due_at)}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            {item.claimed_at && `Claimed ${new Date(item.claimed_at).toLocaleTimeString()}`}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (item.item_url) {
                                  window.location.href = item.item_url;
                                }
                              }}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => completeItem(item.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {myItems.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No items assigned to you</p>
                      <p className="text-sm mt-2">Claim items from the available queue</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
