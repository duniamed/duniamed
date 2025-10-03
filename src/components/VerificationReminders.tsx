import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface VerificationReminder {
  id: string;
  verification_type: string;
  due_date: string;
  reminder_sent: boolean;
  reminder_acknowledged: boolean;
  specialist_id: string;
  created_at: string;
}

export function VerificationReminders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<VerificationReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, [user]);

  const loadReminders = async () => {
    if (!user) return;

    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) return;

      const { data, error } = await supabase
        .from('verification_reminders')
        .select('id, verification_type, due_date, reminder_sent, reminder_acknowledged, specialist_id, created_at')
        .eq('specialist_id', specialist.id)
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setReminders(data || []);
    } catch (error: any) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('verification_reminders')
        .update({
          reminder_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', reminderId);

      if (error) throw error;

      toast({
        title: "Reminder acknowledged",
        description: "We'll remind you again closer to the due date"
      });

      loadReminders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const completeVerification = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('verification_reminders')
        .update({
          reminder_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', reminderId);

      if (error) throw error;

      toast({
        title: "Verification completed",
        description: "Thank you for keeping your credentials up to date"
      });

      loadReminders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getUrgencyVariant = (dueDate: string): "default" | "destructive" | "outline" | "secondary" => {
    const daysUntilDue = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue < 0) return 'destructive';
    if (daysUntilDue <= 7) return 'secondary';
    return 'outline';
  };

  const getUrgencyIcon = (dueDate: string) => {
    const daysUntilDue = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue < 0) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  if (loading) {
    return <div>Loading reminders...</div>;
  }

  if (reminders.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-muted-foreground">All verifications are up to date!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Verification Reminders</h3>
      {reminders.map((reminder) => {
        const daysUntilDue = Math.ceil(
          (new Date(reminder.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
          <Card key={reminder.id} className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {getUrgencyIcon(reminder.due_date)}
                    {reminder.verification_type} Verification
                  </CardTitle>
                  <CardDescription>
                    Due: {new Date(reminder.due_date).toLocaleDateString()}
                    {daysUntilDue < 0 
                      ? ` (Overdue by ${Math.abs(daysUntilDue)} days)` 
                      : ` (${daysUntilDue} days remaining)`
                    }
                  </CardDescription>
                </div>
                <Badge variant={getUrgencyVariant(reminder.due_date)}>
                  {daysUntilDue < 0 ? 'Overdue' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => completeVerification(reminder.id)}
                  className="flex-1"
                >
                  Mark as Completed
                </Button>
                {!reminder.reminder_acknowledged && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => acknowledgeReminder(reminder.id)}
                  >
                    Remind Me Later
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
