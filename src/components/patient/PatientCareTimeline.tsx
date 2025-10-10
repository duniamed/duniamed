import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Pill, TestTube, Video, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: 'appointment' | 'prescription' | 'lab_order' | 'medical_record';
  title: string;
  description: string;
  date: string;
  status?: string;
  icon: React.ReactNode;
}

interface PatientCareTimelineProps {
  patientId: string;
}

export function PatientCareTimeline({ patientId }: PatientCareTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimelineEvents();
  }, [patientId]);

  const loadTimelineEvents = async () => {
    try {
      const allEvents: TimelineEvent[] = [];

      // Load appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, scheduled_at, status, consultation_type')
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: false })
        .limit(10);

      if (appointments) {
        appointments.forEach(apt => {
          allEvents.push({
            id: apt.id,
            type: 'appointment',
            title: `${apt.consultation_type} Consultation`,
            description: `Status: ${apt.status}`,
            date: apt.scheduled_at,
            status: apt.status,
            icon: <Video className="h-4 w-4" />
          });
        });
      }

      // Load prescriptions
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('id, medication_name, created_at, status')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (prescriptions) {
        prescriptions.forEach(rx => {
          allEvents.push({
            id: rx.id,
            type: 'prescription',
            title: 'Prescription',
            description: rx.medication_name,
            date: rx.created_at,
            status: rx.status,
            icon: <Pill className="h-4 w-4" />
          });
        });
      }

      // Load medical records
      const { data: records } = await supabase
        .from('medical_records')
        .select('id, record_type, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (records) {
        records.forEach(record => {
          allEvents.push({
            id: record.id,
            type: 'medical_record',
            title: 'Medical Record',
            description: record.record_type || 'Document uploaded',
            date: record.created_at,
            icon: <FileText className="h-4 w-4" />
          });
        });
      }

      // Sort all events by date
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(allEvents.slice(0, 20));
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading timeline...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Care Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No events yet</p>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {event.icon}
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                    {event.status && (
                      <Badge variant={event.status === 'completed' ? 'default' : 'secondary'}>
                        {event.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
