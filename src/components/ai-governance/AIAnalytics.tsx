import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LogStats {
  total_interactions: number;
  avg_latency_ms: number;
  contexts: Record<string, number>;
  flags_count: number;
}

export function AIAnalytics() {
  const [isExporting, setIsExporting] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['aiLogStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_symptom_logs')
        .select('context, latency_ms, flags');

      if (error) throw error;

      const total_interactions = data.length;
      const avg_latency_ms = data.reduce((sum, log) => sum + (log.latency_ms || 0), 0) / total_interactions || 0;
      
      const contexts: Record<string, number> = {};
      let flags_count = 0;

      data.forEach(log => {
        contexts[log.context] = (contexts[log.context] || 0) + 1;
        if (log.flags && Object.keys(log.flags).length > 0) {
          flags_count++;
        }
      });

      return {
        total_interactions,
        avg_latency_ms: Math.round(avg_latency_ms),
        contexts,
        flags_count
      } as LogStats;
    }
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('ai_symptom_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Convert to CSV
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'object' ? JSON.stringify(val) : val
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">AI Interaction Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Anonymized logs for research and quality improvement
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Interactions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_interactions.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avg_latency_ms}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Flagged Interactions
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.flags_count}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.contexts && Object.entries(stats.contexts).sort((a, b) => b[1] - a[1])[0]?.[0]}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Context Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.contexts && Object.entries(stats.contexts).map(([context, count]) => (
              <div key={context} className="flex justify-between items-center">
                <span className="capitalize">{context}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(count / stats.total_interactions) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground space-y-1 p-4 bg-muted rounded-lg">
        <div className="font-medium">Privacy Notice:</div>
        <ul className="list-disc list-inside space-y-0.5">
          <li>All logs are anonymized and contain no direct identifiers</li>
          <li>Exports are audited and linked to the requesting administrator</li>
          <li>Data retention follows organizational and regulatory policies</li>
        </ul>
      </div>
    </div>
  );
}
