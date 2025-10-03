import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, CheckSquare, Clock, AlertCircle, MapPin, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ProcedureTrackingPatient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [procedures, setProcedures] = useState<any[]>([]);

  useEffect(() => {
    loadProcedures();
  }, [user]);

  const loadProcedures = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('procedure_orders')
        .select(`
          *,
          specialist:specialist_id(id, user_id),
          checklist_items:procedure_checklist_items(*)
        `)
        .eq('patient_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setProcedures(data || []);
    } catch (error) {
      console.error('Error loading procedures:', error);
      toast({
        title: 'Error',
        description: 'Failed to load procedures',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-500',
      prep: 'bg-yellow-500',
      'in_progress': 'bg-orange-500',
      recovery: 'bg-purple-500',
      completed: 'bg-green-500',
      cancelled: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getCompletionProgress = (procedure: any) => {
    if (!procedure.checklist_items || procedure.checklist_items.length === 0) return 0;
    const completed = procedure.checklist_items.filter((item: any) => item.is_completed).length;
    return (completed / procedure.checklist_items.length) * 100;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold">My Procedures</h1>
          <p className="text-muted-foreground mt-2">
            Track your upcoming and completed procedures with real-time status updates
          </p>
        </div>

        {procedures.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No procedures scheduled</p>
              <p className="text-sm text-muted-foreground">
                Your scheduled procedures will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {procedures.map((procedure) => {
              const progress = getCompletionProgress(procedure);
              const isUpcoming = new Date(procedure.scheduled_date) > new Date();

              return (
                <Card key={procedure.id} className={isUpcoming ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {procedure.procedure_name}
                          <Badge className={getStatusColor(procedure.status)}>
                            {procedure.status.replace('_', ' ')}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(procedure.scheduled_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {procedure.scheduled_time && ` at ${procedure.scheduled_time}`}
                        </CardDescription>
                      </div>
                      {isUpcoming && (
                        <Badge variant="outline" className="bg-primary/10">
                          <Clock className="h-3 w-3 mr-1" />
                          Upcoming
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {procedure.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{procedure.location}</span>
                      </div>
                    )}

                    {procedure.description && (
                      <p className="text-sm">{procedure.description}</p>
                    )}

                    {procedure.checklist_items && procedure.checklist_items.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Pre-Procedure Checklist</span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(progress)}% complete
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="space-y-2">
                          {procedure.checklist_items.map((item: any) => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-2 p-2 rounded-lg ${
                                item.is_completed ? 'bg-green-50' : 'bg-muted'
                              }`}
                            >
                              {item.is_completed ? (
                                <CheckSquare className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              )}
                              <span className="text-sm">{item.task_name}</span>
                              {item.due_date && !item.is_completed && (
                                <Badge variant="outline" className="ml-auto">
                                  Due: {new Date(item.due_date).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {procedure.pre_procedure_instructions && (
                      <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-blue-900 font-medium">
                          <AlertCircle className="h-4 w-4" />
                          Important Instructions
                        </div>
                        <p className="text-sm text-blue-900">
                          {procedure.pre_procedure_instructions}
                        </p>
                      </div>
                    )}

                    {procedure.status === 'completed' && procedure.post_procedure_notes && (
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div className="font-medium">Post-Procedure Notes</div>
                        <p className="text-sm text-muted-foreground">
                          {procedure.post_procedure_notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Procedure Tracking Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Real-time status updates from check-in to discharge</p>
            <p>• Automated pre-procedure checklists and reminders</p>
            <p>• Location and parking information</p>
            <p>• Post-procedure instructions and care guidelines</p>
            <p>• Family notification system for status updates</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}