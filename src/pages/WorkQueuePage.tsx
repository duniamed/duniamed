import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { WorkQueueItem } from '@/components/work-queue/WorkQueueItem';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const WorkQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!specialist) return;

      // Load work queue items (placeholder)
      setQueue([]);
    } catch (error) {
      console.error('Load queue error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAIPrioritization = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-work-queue-prioritize', {
        body: {}
      });

      if (error) throw error;

      toast({
        title: "AI Prioritization Complete",
        description: `Queue re-ordered based on urgency and complexity`,
      });

      loadQueue();
    } catch (error: any) {
      toast({
        title: "Prioritization Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const stats = {
    pending: queue.filter(i => i.status === 'pending').length,
    inProgress: queue.filter(i => i.status === 'in_progress').length,
    urgent: queue.filter(i => i.priority === 'urgent').length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Work Queue</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button onClick={runAIPrioritization}>
            <Sparkles className="mr-2 h-4 w-4" />
            AI Prioritize
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {queue.map((item) => (
          <WorkQueueItem key={item.id} item={item} />
        ))}

        {queue.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              Your work queue is empty!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
