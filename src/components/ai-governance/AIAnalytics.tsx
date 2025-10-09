import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AIAnalytics() {
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['aiSymptomStats'],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('ai_symptom_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const totalInteractions = logs.length;
      const avgLatency = logs.reduce((sum, log) => sum + (log.latency_ms || 0), 0) / totalInteractions;
      const withCitations = logs.filter(log => 
        Array.isArray(log.citations) && log.citations.length > 0
      ).length;
      const abstained = logs.filter(log => 
        typeof log.flags === 'object' && log.flags !== null && (log.flags as any).abstained
      ).length;

      const contextBreakdown = logs.reduce((acc, log) => {
        acc[log.context] = (acc[log.context] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const recentLogs = logs.slice(0, 20);

      return {
        totalInteractions,
        avgLatency: Math.round(avgLatency),
        citationRate: ((withCitations / totalInteractions) * 100).toFixed(1),
        abstainRate: ((abstained / totalInteractions) * 100).toFixed(1),
        contextBreakdown,
        recentLogs,
      };
    },
  });

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const { data: logs, error } = await supabase
        .from('ai_symptom_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      let content: string;
      let mimeType: string;
      let filename: string;

      if (format === 'csv') {
        const headers = ['timestamp', 'context', 'user_role', 'latency_ms', 'has_citations', 'abstained'];
        const rows = logs.map(log => [
          log.timestamp,
          log.context,
          log.user_role,
          log.latency_ms,
          Array.isArray(log.citations) && log.citations.length > 0,
          typeof log.flags === 'object' && log.flags !== null && (log.flags as any).abstained || false,
        ]);
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        mimeType = 'text/csv';
        filename = `ai-logs-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        content = JSON.stringify(logs, null, 2);
        mimeType = 'application/json';
        filename = `ai-logs-${new Date().toISOString().split('T')[0]}.json`;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Downloaded ${logs.length} records as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-muted rounded"></div>
      <div className="h-32 bg-muted rounded"></div>
    </div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Interaction Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Anonymized AI interaction metrics and exports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Total Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInteractions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Avg Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgLatency}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Citation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.citationRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Abstain Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.abstainRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Context Breakdown</CardTitle>
          <CardDescription>Interaction distribution by context</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.contextBreakdown).map(([context, count]) => (
              <Badge key={context} variant="secondary">
                {context}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Interactions</CardTitle>
          <CardDescription>Last 20 AI interactions (anonymized)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{log.context}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    {log.citations?.length || 0} citations • {log.latency_ms}ms latency
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {log.flags?.abstained && (
                    <Badge variant="destructive">Abstained</Badge>
                  )}
                  {log.citations?.length > 0 && (
                    <Badge variant="default">Cited</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
