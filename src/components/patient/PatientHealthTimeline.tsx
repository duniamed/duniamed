import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Pill, FileText, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'appointment' | 'prescription' | 'lab' | 'vaccination';
  title: string;
  description: string;
  status?: string;
}

interface PatientHealthTimelineProps {
  patientId: string;
}

export function PatientHealthTimeline({ patientId }: PatientHealthTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [patientId]);

  const loadTimeline = async () => {
    try {
      // Fetch appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          status,
          consultation_type,
          chief_complaint,
          specialists!appointments_specialist_id_fkey (
            profiles!specialists_user_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: false })
        .limit(20);

      // Fetch prescriptions
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('id, created_at, medication_name, status, dosage')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Combine into timeline
      const timeline: TimelineEvent[] = [];

      appointments?.forEach((apt: any) => {
        const specialistName = `Dr. ${apt.specialists?.profiles?.first_name || ''} ${apt.specialists?.profiles?.last_name || ''}`.trim();
        timeline.push({
          id: apt.id,
          date: new Date(apt.scheduled_at),
          type: 'appointment',
          title: `Consultation with ${specialistName || 'Specialist'}`,
          description: apt.chief_complaint || `${apt.consultation_type} consultation`,
          status: apt.status
        });
      });

      prescriptions?.forEach((rx: any) => {
        timeline.push({
          id: rx.id,
          date: new Date(rx.created_at),
          type: 'prescription',
          title: rx.medication_name,
          description: `${rx.dosage || 'Dosage not specified'} - ${rx.status}`,
          status: rx.status
        });
      });

      // Sort by date descending
      timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

      setEvents(timeline);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-5 w-5" />;
      case 'prescription':
        return <Pill className="h-5 w-5" />;
      case 'lab':
        return <FileText className="h-5 w-5" />;
      case 'vaccination':
        return <Activity className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      approved: 'default',
      dispensed: 'default'
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className="text-xs">
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical History Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No medical events recorded yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            
            {/* Events */}
            <div className="space-y-6">
              {events.map((event, idx) => (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon circle */}
                  <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary">
                    {getEventIcon(event.type)}
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="font-semibold">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(event.date, 'MMM d, yyyy • h:mm a')}
                        </div>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
