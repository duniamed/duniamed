import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface ModerationLog {
  id: string;
  content_type: string;
  content_id: string;
  original_content: string;
  redacted_content: string;
  phi_detected: any;
  toxicity_score: number;
  moderation_action: string;
  created_at: string;
}

export default function ModerationDashboard() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error('Failed to load moderation logs');
    } finally {
      setLoading(false);
    }
  };

  const moderateContent = async (contentType: string, contentId: string, content: string) => {
    setModerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-moderate-content', {
        body: { content, contentType, contentId }
      });

      if (error) throw error;

      toast.success(`Content moderated: ${data.moderationAction}`);
      fetchLogs();
      
      return data;
    } catch (error: any) {
      toast.error('Moderation failed: ' + error.message);
    } finally {
      setModerating(false);
    }
  };

  const getModerationBadge = (action: string) => {
    switch (action) {
      case 'allow':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Allowed</Badge>;
      case 'redact':
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Redacted</Badge>;
      case 'block':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Blocked</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            AI Content Moderation
          </h1>
          <p className="text-muted-foreground">PHI detection, toxicity analysis, and content safety</p>
        </div>
        <Button onClick={fetchLogs} disabled={loading}>
          Refresh
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{log.content_type}</span>
                    {getModerationBadge(log.moderation_action)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">
                  Toxicity: {(log.toxicity_score * 100).toFixed(1)}%
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Original:</p>
                  <p className="text-sm bg-muted p-2 rounded">{log.original_content}</p>
                </div>

                {log.redacted_content && log.redacted_content !== log.original_content && (
                  <div>
                    <p className="text-sm font-medium">Redacted:</p>
                    <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                      {log.redacted_content}
                    </p>
                  </div>
                )}

                {log.phi_detected && Array.isArray(log.phi_detected) && log.phi_detected.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600">PHI Detected:</p>
                    <div className="flex flex-wrap gap-1">
                      {log.phi_detected.map((phi: any, idx: number) => (
                        <Badge key={idx} variant="destructive" className="text-xs">
                          {phi.type}: {phi.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
