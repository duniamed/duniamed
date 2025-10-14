import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Mic, TrendingUp, Clock, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function VoiceCommandHistory() {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  const handleLoadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-command-history', {
        body: {
          userId: 'current-user-id',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      });

      if (error) throw error;

      setAnalytics(data.analytics);
      toast({
        title: "History Loaded",
        description: `Found ${data.commands?.length || 0} voice commands`
      });
    } catch (error: any) {
      toast({
        title: "Load Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mic className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Voice Command History</h2>
        </div>
        <Button onClick={handleLoadHistory} disabled={loading}>
          Load History
        </Button>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Commands</p>
                <p className="text-2xl font-bold">{analytics.total_commands}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{analytics.success_rate}%</p>
              </div>
            </div>
            <Progress value={analytics.success_rate} className="mt-4" />
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">1.2s</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Most Used Commands</h3>
        <div className="space-y-3">
          {analytics?.most_used_commands?.map((cmd: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mic className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{cmd.command}</p>
                  <p className="text-sm text-muted-foreground">Used {cmd.count} times</p>
                </div>
              </div>
              <Badge variant="outline">{cmd.category}</Badge>
            </div>
          )) || <p className="text-muted-foreground">No data available</p>}
        </div>
      </Card>
    </div>
  );
}
