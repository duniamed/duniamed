import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Bell, CheckCircle } from 'lucide-react';

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  description: string;
  status: string;
  escalation_level: number;
  created_at: string;
}

export default function EmergencyProtocols() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('emergency_incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading incidents',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <h1 className="text-3xl font-bold">Emergency Protocols</h1>
          </div>
          <p className="text-muted-foreground">
            Manage and respond to emergency incidents
          </p>
        </div>

        <div className="grid gap-4">
          {incidents.map((incident) => (
            <Card key={incident.id} className={incident.status === 'active' ? 'border-destructive' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{incident.incident_type}</CardTitle>
                      <Badge variant={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                      {incident.status === 'active' && (
                        <Badge variant="destructive">
                          <Bell className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Level {incident.escalation_level} • {new Date(incident.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{incident.description}</p>
                {incident.status === 'resolved' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Resolved</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {incidents.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No emergency incidents</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}