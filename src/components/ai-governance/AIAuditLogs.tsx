import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { FileText, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AuditLog {
  id: string;
  config_id: string | null;
  action: string;
  actor_id: string;
  diff: Record<string, any> | null;
  timestamp: string;
  justification: string;
  ip_address: string | null;
  user_agent: string | null;
}

export function AIAuditLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['aiAuditLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_policy_audit')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AuditLog[];
    }
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'default';
      case 'update': return 'secondary';
      case 'approve': return 'default';
      case 'rollback': return 'destructive';
      case 'retire': return 'outline';
      case 'deploy': return 'default';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return <div>Loading audit logs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Immutable audit trail of all AI configuration changes</span>
      </div>

      <div className="space-y-2">
        {logs?.map((log) => (
          <div
            key={log.id}
            className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Badge variant={getActionColor(log.action)}>
                  {log.action}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                </span>
              </div>
              {log.config_id && (
                <Badge variant="outline" className="font-mono text-xs">
                  {log.config_id.slice(0, 8)}
                </Badge>
              )}
            </div>

            <div className="text-sm">
              <div className="font-medium">{log.justification}</div>
              {log.ip_address && (
                <div className="text-muted-foreground text-xs mt-1">
                  IP: {log.ip_address}
                </div>
              )}
            </div>

            {log.diff && Object.keys(log.diff).length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  <FileText className="h-3 w-3 inline mr-1" />
                  View changes
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                  {JSON.stringify(log.diff, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
