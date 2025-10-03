import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Bell, X } from "lucide-react";
import { format } from "date-fns";

interface WaitlistEntry {
  id: string;
  specialist_id: string;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  notified_at: string | null;
  specialists: {
    profiles: {
      first_name: string;
      last_name: string;
    };
    specialty: string[];
  };
}

export default function WaitlistManagement() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchWaitlist();
  }, [profile]);

  const fetchWaitlist = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("appointment_waitlist")
      .select(`
        *,
        specialists!inner(
          specialty,
          profiles:user_id(first_name, last_name)
        )
      `)
      .eq("patient_id", profile.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEntries(data as any);
    }
    setLoading(false);
  };

  const removeFromWaitlist = async (entryId: string) => {
    const { error } = await supabase
      .from("appointment_waitlist")
      .delete()
      .eq("id", entryId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove from waitlist",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Removed",
        description: "You've been removed from the waitlist",
      });
      fetchWaitlist();
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Waitlist">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Waitlist">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Waitlist Entries</CardTitle>
            <CardDescription>
              You'll be notified when appointments become available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active waitlist entries</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <Card key={entry.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              Dr. {entry.specialists?.profiles?.first_name}{" "}
                              {entry.specialists?.profiles?.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {entry.specialists?.specialty?.join(", ")}
                            </p>
                          </div>

                          <div className="space-y-2 text-sm">
                            {entry.preferred_date && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Preferred: {format(new Date(entry.preferred_date), "PPP")}
                                </span>
                              </div>
                            )}

                            {entry.preferred_time_slot && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Time: {entry.preferred_time_slot}</span>
                              </div>
                            )}

                            {entry.notes && (
                              <p className="text-muted-foreground italic">
                                Note: {entry.notes}
                              </p>
                            )}

                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  entry.status === "waiting" ? "secondary" : "default"
                                }
                              >
                                {entry.status}
                              </Badge>
                              {entry.notified_at && (
                                <Badge variant="outline" className="text-green-600">
                                  <Bell className="w-3 h-3 mr-1" />
                                  Notified{" "}
                                  {format(new Date(entry.notified_at), "MMM d, h:mm a")}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Added {format(new Date(entry.created_at), "PPP 'at' h:mm a")}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromWaitlist(entry.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-blue-900">How Waitlist Works</p>
                <p className="text-sm text-blue-700">
                  When a matching appointment becomes available (cancellation or new slot), you'll receive:
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 mt-2">
                  <li>Email notification</li>
                  <li>SMS alert (if phone number on file)</li>
                  <li>15-minute window to book before offered to next person</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
