import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, CheckCircle2, XCircle, Star, DollarSign, Users, RefreshCw } from "lucide-react";

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [role, setRole] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(profile?.role || "");

      if (profile?.role === "specialist") {
        const { data: specialist } = await supabase
          .from("specialists")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (specialist) {
          // Get current month metrics
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

          const { data } = await supabase
            .from("specialist_performance_metrics")
            .select("*")
            .eq("specialist_id", specialist.id)
            .eq("period_start", startOfMonth)
            .single();

          setMetrics(data);
        }
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = async () => {
    setCalculating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: specialist } = await supabase
        .from("specialists")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!specialist) throw new Error("Specialist not found");

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      const { data, error } = await supabase.functions.invoke("calculate-performance-metrics", {
        body: {
          specialistId: specialist.id,
          clinicId: null,
          periodStart: startOfMonth,
          periodEnd: endOfMonth,
        },
      });

      if (error) throw error;

      toast({ title: "Metrics calculated successfully" });
      loadMetrics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Performance Metrics">
        <div className="flex items-center justify-center h-64">
          <p>Loading metrics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Performance Metrics">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Track your performance across key metrics
          </p>
          <Button onClick={calculateMetrics} disabled={calculating}>
            <RefreshCw className={`w-4 h-4 mr-2 ${calculating ? "animate-spin" : ""}`} />
            Refresh Metrics
          </Button>
        </div>

        {metrics ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed Appointments
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.appointments_completed}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Cancelled Appointments
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.appointments_cancelled}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.appointments_completed > 0
                      ? `${(
                          (metrics.appointments_cancelled /
                            (metrics.appointments_completed +
                              metrics.appointments_cancelled)) *
                          100
                        ).toFixed(1)}% rate`
                      : "0% rate"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">No-Shows</CardTitle>
                  <Activity className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.no_show_count}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.appointments_completed > 0
                      ? `${(
                          (metrics.no_show_count /
                            (metrics.appointments_completed +
                              metrics.no_show_count)) *
                          100
                        ).toFixed(1)}% rate`
                      : "0% rate"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.average_rating ? metrics.average_rating.toFixed(2) : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">Out of 5.0</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${parseFloat(metrics.total_revenue || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Patients</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.patient_count}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  Key observations based on your metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.appointments_completed > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Strong Performance:</strong> You completed{" "}
                        {metrics.appointments_completed} appointments this month.
                      </p>
                    </div>
                  )}
                  
                  {metrics.no_show_count > 2 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <strong>Room for Improvement:</strong> Consider implementing
                        automated appointment reminders to reduce no-shows.
                      </p>
                    </div>
                  )}
                  
                  {metrics.average_rating && metrics.average_rating >= 4.5 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Excellent Ratings:</strong> Your patients are very
                        satisfied with your care. Keep up the great work!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No metrics available for the current period
              </p>
              <Button onClick={calculateMetrics} disabled={calculating}>
                Calculate Metrics
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
