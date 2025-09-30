import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Mail, Phone, User } from 'lucide-react';

export default function WaitlistManagement() {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_waitlist')
        .select(`
          *,
          profiles!appointment_waitlist_patient_id_fkey(first_name, last_name, email, phone),
          specialists!inner(
            user_id,
            specialty,
            profiles!specialists_user_id_fkey(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setWaitlist(data || []);
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

  const notifyPatient = async (entry: any) => {
    try {
      // Update waitlist status
      const { error } = await supabase
        .from('appointment_waitlist')
        .update({ 
          status: 'notified',
          notified_at: new Date().toISOString()
        })
        .eq('id', entry.id);

      if (error) throw error;

      // In a real implementation, send email/SMS here
      toast({
        title: 'Patient Notified',
        description: `${entry.profiles.first_name} ${entry.profiles.last_name} has been notified`,
      });

      fetchWaitlist();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const removeFromWaitlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointment_waitlist')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Removed',
        description: 'Patient removed from waitlist',
      });

      fetchWaitlist();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Waitlist Management"
        description="Manage patient appointment waitlist"
      >
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">Loading waitlist...</div>
          ) : waitlist.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No patients on the waitlist</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {waitlist.map((entry) => (
                <Card key={entry.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">
                            {entry.profiles.first_name} {entry.profiles.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            For: Dr. {entry.specialists.profiles.first_name} {entry.specialists.profiles.last_name}
                          </p>
                        </div>
                        <Badge variant={entry.status === 'waiting' ? 'default' : 'secondary'}>
                          {entry.status}
                        </Badge>
                      </div>

                      {entry.preferred_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Preferred: {new Date(entry.preferred_date).toLocaleDateString()}</span>
                          {entry.preferred_time_slot && (
                            <>
                              <Clock className="h-4 w-4 ml-2" />
                              <span>{entry.preferred_time_slot}</span>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {entry.profiles.email}
                        </div>
                        {entry.profiles.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {entry.profiles.phone}
                          </div>
                        )}
                      </div>

                      {entry.notes && (
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          {entry.notes}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Added: {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {entry.status === 'waiting' && (
                        <>
                          <Button onClick={() => notifyPatient(entry)}>
                            Notify
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => removeFromWaitlist(entry.id)}
                          >
                            Remove
                          </Button>
                        </>
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