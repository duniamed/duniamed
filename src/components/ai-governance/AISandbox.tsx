import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Play, Square, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SandboxSession {
  id: string;
  started_by: string;
  config_version: number | null;
  config_snapshot: Record<string, any>;
  source_scope_snapshot: Record<string, any>;
  notes: string | null;
  status: string;
  test_results: Record<string, any> | null;
  created_at: string;
  ended_at: string | null;
}

export function AISandbox() {
  const [testInput, setTestInput] = useState('');
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sandboxSessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_sandbox_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as SandboxSession[];
    }
  });

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get active config snapshot
      const { data: config } = await supabase
        .from('ai_config_profiles')
        .select('*')
        .eq('is_active', true)
        .single();

      // Get approved sources snapshot
      const { data: sources } = await supabase
        .from('ai_source_registry')
        .select('*')
        .eq('status', 'approved');

      const { data, error } = await supabase
        .from('ai_sandbox_sessions')
        .insert({
          started_by: user.id,
          config_snapshot: config || {},
          source_scope_snapshot: sources || [],
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sandboxSessions'] });
      setActiveSession(data.id);
      toast.success('Sandbox session started');
    },
    onError: (error: Error) => {
      toast.error(`Failed to start session: ${error.message}`);
    }
  });

  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('ai_sandbox_sessions')
        .update({
          status: 'concluded',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sandboxSessions'] });
      setActiveSession(null);
      toast.success('Sandbox session ended');
    }
  });

  const runTestMutation = useMutation({
    mutationFn: async ({ sessionId, input }: { sessionId: string; input: string }) => {
      // In production, this would call your AI API with the sandbox config
      // For now, we'll simulate a test result
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const testResult = {
        input_hash: btoa(input),
        timestamp: new Date().toISOString(),
        mock_response: 'Sandbox test response (integrate with actual AI API)',
        evaluator_scores: {
          faithfulness: 0.92,
          relevance: 0.88
        }
      };

      const { error } = await supabase
        .from('ai_sandbox_sessions')
        .update({
          test_results: testResult
        })
        .eq('id', sessionId);

      if (error) throw error;
      return testResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sandboxSessions'] });
      toast.success('Test completed');
    }
  });

  const handleRunTest = () => {
    if (!activeSession || !testInput) {
      toast.error('Please start a session and provide test input');
      return;
    }
    runTestMutation.mutate({ sessionId: activeSession, input: testInput });
  };

  if (isLoading) {
    return <div>Loading sandbox...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Test Environment</h3>
          {activeSession ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => endSessionMutation.mutate(activeSession)}
            >
              <Square className="h-4 w-4 mr-2" />
              End Session
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => startSessionMutation.mutate()}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          )}
        </div>

        {activeSession && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-input">Test Input (Synthetic Data Only)</Label>
              <Textarea
                id="test-input"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Enter test symptoms or query..."
                rows={4}
              />
            </div>

            <Button
              onClick={handleRunTest}
              disabled={!testInput || runTestMutation.isPending}
            >
              {runTestMutation.isPending ? 'Running...' : 'Run Test'}
            </Button>

            {runTestMutation.data && (
              <div className="border rounded p-3 bg-muted text-sm space-y-2">
                <div className="font-medium">Test Result:</div>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(runTestMutation.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Recent Sessions</h3>
        <div className="grid gap-2">
          {sessions?.map((session) => (
            <div
              key={session.id}
              className="border rounded p-3 text-sm space-y-2"
            >
              <div className="flex justify-between items-center">
                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(session.created_at), 'MMM d, HH:mm')}
                </span>
              </div>
              {session.test_results && (
                <div className="text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" />
                  Test completed
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
