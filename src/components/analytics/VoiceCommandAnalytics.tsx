import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { Mic, TrendingUp, Clock, BarChart3 } from 'lucide-react';

export function VoiceCommandAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  const loadHistoryMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('voice-command-history', {
        body: { days: 30 }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setAnalytics(data.analytics);
      toast({
        title: "History Loaded",
        description: `Analyzed ${data.analytics.total_commands} commands`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Load History",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Command Analytics
        </CardTitle>
        <CardDescription>Track voice interaction patterns and performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={() => loadHistoryMutation.mutate()} 
          disabled={loadHistoryMutation.isPending}
        >
          {loadHistoryMutation.isPending ? 'Loading...' : 'Load History (30 Days)'}
        </Button>

        {analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Total Commands
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total_commands}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Success: {analytics.successful_commands} | Failed: {analytics.failed_commands}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((analytics.successful_commands / analytics.total_commands) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Avg Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.avg_response_time.toFixed(0)}ms
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Most Used Commands</h3>
              <div className="space-y-2">
                {Object.entries(analytics.most_used_commands).slice(0, 5).map(([cmd, count]: [string, any]) => (
                  <div key={cmd} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium capitalize">{cmd.replace(/_/g, ' ')}</span>
                    <Badge variant="secondary">{count} uses</Badge>
                  </div>
                ))}
              </div>
            </div>

            {analytics.categories && Object.keys(analytics.categories).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Command Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(analytics.categories).map(([category, count]: [string, any]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm capitalize">{category}</span>
                      <Badge variant="outline" className="text-xs">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
