import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function ProviderActivity() {
  const { toast } = useToast();
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_activity')
        .select(`
          *,
          specialist:specialists(id, user:profiles(first_name, last_name)),
          clinic:clinics(name)
        `)
        .order('activity_score', { ascending: true })
        .limit(50);

      if (error) throw error;
      setActivity(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading activity",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityStatus = (score: number, lastLogin: string) => {
    const daysSinceLogin = Math.floor(
      (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (score >= 80 && daysSinceLogin <= 7) {
      return { label: 'Active', variant: 'default' as const, icon: TrendingUp };
    } else if (score >= 50 && daysSinceLogin <= 14) {
      return { label: 'Moderate', variant: 'secondary' as const, icon: Activity };
    } else if (daysSinceLogin <= 30) {
      return { label: 'Low Activity', variant: 'outline' as const, icon: Clock };
    } else {
      return { label: 'Inactive', variant: 'destructive' as const, icon: AlertTriangle };
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return <Layout><div className="p-8">Loading activity data...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Provider Activity Tracking
          </h1>
          <p className="text-muted-foreground mt-2">
            C11 Freshness - Monitor provider activity and engagement
          </p>
        </div>

        <div className="grid gap-4">
          {activity.map((item) => {
            const status = getActivityStatus(
              item.activity_score,
              item.last_login || item.created_at
            );
            const StatusIcon = status.icon;

            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {item.specialist?.user?.first_name} {item.specialist?.user?.last_name}
                        {item.clinic?.name}
                      </CardTitle>
                      <CardDescription>
                        Activity Score: {item.activity_score}/100
                      </CardDescription>
                    </div>
                    <Badge variant={status.variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Last Login</p>
                      <p className="font-medium">
                        {item.last_login ? formatDate(item.last_login) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Profile Updated</p>
                      <p className="font-medium">
                        {item.last_profile_update
                          ? formatDate(item.last_profile_update)
                          : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Appointment</p>
                      <p className="font-medium">
                        {item.last_appointment
                          ? formatDate(item.last_appointment)
                          : 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Response Time</p>
                      <p className="font-medium">
                        {item.response_time_avg
                          ? `${Math.floor(item.response_time_avg / 60)} hrs`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {item.activity_score < 50 && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm text-yellow-600 dark:text-yellow-500">
                        <AlertTriangle className="h-4 w-4 inline mr-2" />
                        Low activity detected. This provider may not be actively accepting patients.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {activity.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No provider activity data available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
