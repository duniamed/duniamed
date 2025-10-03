import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarOff, User, AlertCircle, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface ProviderAbsence {
  id: string;
  specialist_id: string;
  absence_type: string;
  start_date: string;
  end_date: string;
  backup_specialist_id: string | null;
  out_of_office_message: string | null;
  auto_redirect: boolean;
  status: string;
  created_at: string;
  notified_patients: boolean;
}

export default function ProviderAbsences() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [absences, setAbsences] = useState<ProviderAbsence[]>([]);

  useEffect(() => {
    loadAbsences();
  }, []);

  const loadAbsences = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_absences')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setAbsences(data || []);
    } catch (error) {
      console.error('Error loading absences:', error);
      toast({
        title: "Error",
        description: "Failed to load provider availability.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAbsenceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      vacation: 'bg-blue-500',
      sick_leave: 'bg-red-500',
      conference: 'bg-purple-500',
      other: 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-yellow-500',
      active: 'bg-orange-500',
      completed: 'bg-green-500',
      cancelled: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const isUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarOff className="h-8 w-8 text-primary" />
            Provider Availability
            <InfoTooltip content="View when your healthcare providers are away. See backup specialists, out-of-office periods, and automatic appointment redirects to ensure continuity of care." />
          </h1>
          <p className="text-muted-foreground mt-2">
            Stay informed about provider availability and alternative options
          </p>
        </div>

        {/* Notice Card */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Continuity of Care</h3>
                <p className="text-sm text-muted-foreground">
                  When your provider is unavailable, we'll automatically suggest backup specialists or
                  reschedule your appointments. You'll receive notifications for any changes to your care plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Absences */}
        <div className="space-y-4">
          {absences.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">All Providers Available</h3>
                  <p className="text-muted-foreground">
                    No scheduled absences at this time
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            absences.map((absence) => {
              const upcoming = isUpcoming(absence.start_date);
              const daysUntil = Math.ceil(
                (new Date(absence.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card key={absence.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Provider Absence
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(absence.start_date).toLocaleDateString()} - {new Date(absence.end_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={getAbsenceTypeColor(absence.absence_type)}>
                        {absence.absence_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(absence.status)}>
                          {absence.status}
                        </Badge>
                        
                        {upcoming && (
                          <Badge variant="secondary">
                            Starts in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                          </Badge>
                        )}

                        {absence.auto_redirect && (
                          <Badge variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Auto-redirect enabled
                          </Badge>
                        )}
                      </div>

                      {/* Out of Office Message */}
                      {absence.out_of_office_message && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Provider Message:</p>
                          <p className="text-sm text-muted-foreground">
                            {absence.out_of_office_message}
                          </p>
                        </div>
                      )}

                      {/* Backup Specialist */}
                      {absence.backup_specialist_id && (
                        <div className="flex items-center gap-2 p-3 border rounded-lg">
                          <User className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">Backup Specialist Assigned</p>
                            <p className="text-xs text-muted-foreground">
                              Your care will be handled by a qualified backup provider
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {upcoming && (
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" className="flex-1" size="sm">
                            View Backup Options
                          </Button>
                          {absence.backup_specialist_id && (
                            <Button className="flex-1" size="sm">
                              Schedule with Backup
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Notification Status */}
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        {absence.notified_patients ? (
                          <p className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            You've been notified of this absence
                          </p>
                        ) : (
                          <p className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-yellow-500" />
                            Notification pending
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
