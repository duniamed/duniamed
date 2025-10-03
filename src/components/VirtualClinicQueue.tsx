import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface QueueItem {
  id: string;
  patient_id: string;
  patient_name: string;
  urgency_level: string;
  chief_complaint: string;
  wait_time_minutes: number;
  assigned_specialist?: string;
  status: 'waiting' | 'in_progress' | 'completed';
  created_at: string;
}

export default function VirtualClinicQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();

    // Real-time subscription
    const channel = supabase
      .channel('virtual-clinic-queue')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments'
      }, () => {
        fetchQueue();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQueue = async () => {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          urgency_level,
          chief_complaint,
          status,
          scheduled_at,
          created_at,
          specialist_id
        `)
        .in('status', ['pending', 'confirmed'])
        .order('urgency_level', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get patient details
      const patientIds = [...new Set(appointments?.map(a => a.patient_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', patientIds);

      const queueItems: QueueItem[] = (appointments || []).map(apt => {
        const profile = profiles?.find(p => p.id === apt.patient_id);
        const waitTime = Math.floor((Date.now() - new Date(apt.created_at).getTime()) / 60000);
        
        return {
          id: apt.id,
          patient_id: apt.patient_id,
          patient_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
          urgency_level: apt.urgency_level,
          chief_complaint: apt.chief_complaint || 'General consultation',
          wait_time_minutes: waitTime,
          assigned_specialist: apt.specialist_id,
          status: apt.status === 'confirmed' ? 'in_progress' : 'waiting',
          created_at: apt.created_at
        };
      });

      setQueue(queueItems);
    } catch (error: any) {
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const assignToMe = async (appointmentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get specialist ID
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) throw new Error('Specialist profile not found');

      const { error } = await supabase
        .from('appointments')
        .update({
          specialist_id: specialist.id,
          status: 'confirmed'
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Appointment assigned to you');
      fetchQueue();
    } catch (error: any) {
      toast.error('Failed to assign: ' + error.message);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Emergency</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-500"><Clock className="w-3 h-3 mr-1" />Urgent</Badge>;
      case 'routine':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Routine</Badge>;
      default:
        return <Badge>{urgency}</Badge>;
    }
  };

  const waitingQueue = queue.filter(q => q.status === 'waiting');
  const inProgressQueue = queue.filter(q => q.status === 'in_progress');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Virtual Clinic Queue</h2>
        <p className="text-muted-foreground">
          AI-powered patient distribution based on skills and availability
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Waiting</h3>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{waitingQueue.length}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">In Progress</h3>
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{inProgressQueue.length}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Avg Wait Time</h3>
            <Clock className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold mt-2">
            {waitingQueue.length > 0
              ? Math.round(waitingQueue.reduce((sum, q) => sum + q.wait_time_minutes, 0) / waitingQueue.length)
              : 0}m
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Waiting Queue ({waitingQueue.length})
          </h3>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {waitingQueue.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {item.patient_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{item.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.chief_complaint}
                        </p>
                      </div>
                    </div>
                    {getUrgencyBadge(item.urgency_level)}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.wait_time_minutes}m waiting
                    </Badge>
                    <Button size="sm" onClick={() => assignToMe(item.id)}>
                      <ArrowRight className="w-4 h-4 mr-1" />
                      Claim
                    </Button>
                  </div>
                </Card>
              ))}

              {waitingQueue.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No patients waiting</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            In Progress ({inProgressQueue.length})
          </h3>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {inProgressQueue.map((item) => (
                <Card key={item.id} className="p-4 border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {item.patient_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{item.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.chief_complaint}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-xs">
                      <User className="w-3 h-3 mr-1" />
                      {item.assigned_specialist ? 'Assigned' : 'Unassigned'}
                    </Badge>
                  </div>
                </Card>
              ))}

              {inProgressQueue.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No active consultations</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
