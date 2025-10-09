import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  User,
  FileText,
  CreditCard,
  UserPlus,
  Settings,
  Bell,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: any;
  created_at: string;
}

const actionIcons: Record<string, any> = {
  appointment_created: Calendar,
  appointment_cancelled: Calendar,
  profile_updated: User,
  document_uploaded: FileText,
  payment_completed: CreditCard,
  user_registered: UserPlus,
  settings_changed: Settings,
  notification_sent: Bell,
};

const actionLabels: Record<string, string> = {
  appointment_created: 'Created appointment',
  appointment_cancelled: 'Cancelled appointment',
  profile_updated: 'Updated profile',
  document_uploaded: 'Uploaded document',
  payment_completed: 'Completed payment',
  user_registered: 'Registered account',
  settings_changed: 'Changed settings',
  notification_sent: 'Received notification',
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
    subscribeToActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load activities',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToActivities = () => {
    const channel = supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        (payload) => {
          setActivities((prev) => [payload.new as Activity, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const groupByDate = (activities: Activity[]) => {
    const grouped: Record<string, Activity[]> = {};
    activities.forEach((activity) => {
      const date = new Date(activity.created_at).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(activity);
    });
    return grouped;
  };

  const groupedActivities = groupByDate(activities);

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Activity Feed</h1>

      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([date, dayActivities]) => (
          <div key={date} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {date}
            </h2>
            <div className="space-y-2">
              {dayActivities.map((activity) => {
                const Icon = actionIcons[activity.action] || Bell;
                const label = actionLabels[activity.action] || activity.action;

                return (
                  <Card
                    key={activity.id}
                    className="p-4 backdrop-blur-md bg-card/50 animate-fade-in"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{label}</p>
                        {activity.metadata?.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.metadata.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {activities.length === 0 && !loading && (
          <Card className="p-12 text-center backdrop-blur-md bg-card/50">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
            <p className="text-muted-foreground">
              Your activity feed will appear here as you use the platform
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
