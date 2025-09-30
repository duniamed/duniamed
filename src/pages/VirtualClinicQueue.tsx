import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, AlertCircle, CheckCircle, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function VirtualClinicQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      fetchQueue();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('queue-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'virtual_clinic_queue' 
          }, 
          () => {
            fetchQueue();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const fetchQueue = async () => {
    try {
      // Get specialist's clinics
      const { data: specialistData } = await supabase
        .from('specialists')
        .select('id, specialist_clinics(clinic_id)')
        .eq('user_id', profile?.id)
        .single();

      if (!specialistData) return;

      const clinicIds = specialistData.specialist_clinics?.map((sc: any) => sc.clinic_id) || [];

      const { data, error } = await supabase
        .from('virtual_clinic_queue')
        .select(`
          *,
          clinics(name, brand_color),
          profiles!virtual_clinic_queue_patient_id_fkey(first_name, last_name),
          specialists(
            profiles!specialists_user_id_fkey(first_name, last_name)
          )
        `)
        .in('clinic_id', clinicIds)
        .in('status', ['waiting', 'assigned'])
        .order('urgency_level', { ascending: false })
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setQueue(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const assignToMe = async (queueEntry: any) => {
    try {
      const { data: specialistData } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', profile?.id)
        .single();

      const { error } = await supabase
        .from('virtual_clinic_queue')
        .update({ 
          assigned_specialist_id: specialistData.id,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', queueEntry.id);

      if (error) throw error;

      toast({
        title: 'Patient Assigned',
        description: 'You have been assigned to this patient',
      });

      fetchQueue();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const startConsultation = async (queueEntry: any) => {
    try {
      const { error } = await supabase
        .from('virtual_clinic_queue')
        .update({ status: 'in_consultation' })
        .eq('id', queueEntry.id);

      if (error) throw error;

      toast({
        title: 'Consultation Started',
        description: 'Patient consultation has begun',
      });

      fetchQueue();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'destructive';
      case 'urgent': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Virtual Clinic Queue"
        description="Shared patient queue for virtual clinic"
      >
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">Loading queue...</div>
          ) : queue.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-muted-foreground">No patients waiting in queue</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {queue.map((entry, index) => (
                <Card key={entry.id} className="p-6 relative">
                  <div className="absolute top-4 right-4 text-4xl font-bold text-muted-foreground/20">
                    #{index + 1}
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant={getUrgencyColor(entry.urgency_level)}>
                          {entry.urgency_level}
                        </Badge>
                        <div>
                          <p className="font-semibold">
                            {entry.profiles.first_name} {entry.profiles.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.clinics.name}
                          </p>
                        </div>
                      </div>

                      {entry.symptoms && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="text-sm">
                            <p className="font-medium mb-1">Symptoms:</p>
                            <p className="text-muted-foreground">
                              {JSON.stringify(entry.symptoms)}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Joined: {new Date(entry.joined_at).toLocaleTimeString()}</span>
                        </div>
                        {entry.estimated_wait_minutes && (
                          <span>Est. wait: {entry.estimated_wait_minutes} min</span>
                        )}
                      </div>

                      {entry.assigned_specialist_id && entry.specialists && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          <span>Assigned to: Dr. {entry.specialists.profiles.first_name} {entry.specialists.profiles.last_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {entry.status === 'waiting' && (
                        <Button onClick={() => assignToMe(entry)}>
                          Assign to Me
                        </Button>
                      )}
                      {entry.status === 'assigned' && entry.assigned_specialist_id && (
                        <Button onClick={() => startConsultation(entry)}>
                          Start Consultation
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}