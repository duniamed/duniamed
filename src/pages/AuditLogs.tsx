import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  ip_address: string;
  user_agent: string;
}

export default function AuditLogs() {
  return (
    <ProtectedRoute>
      <AuditLogsContent />
    </ProtectedRoute>
  );
}

function AuditLogsContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setLogs(data);
    }

    setLoading(false);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-500/10 text-green-500';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-500';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500';
      case 'VIEW':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">Track all activities in your account</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>Recent actions performed in your account</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No activity logs yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.resource_type}</p>
                          <p className="text-xs text-muted-foreground">{log.resource_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ip_address || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
