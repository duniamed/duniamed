import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CapacityAnalytics() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedLocation]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clinics } = await supabase
        .from("clinics")
        .select("id")
        .eq("created_by", user.id);

      if (clinics && clinics.length > 0) {
        const clinicId = clinics[0].id;

        // Load locations
        const { data: locs } = await supabase
          .from("clinic_locations")
          .select("*")
          .eq("clinic_id", clinicId)
          .eq("is_active", true);
        setLocations(locs || []);

        // Load capacity metrics
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        let query = supabase
          .from("capacity_metrics")
          .select("*, clinic_locations(location_name)")
          .eq("clinic_id", clinicId)
          .gte("date", startDate.toISOString().split("T")[0])
          .order("date", { ascending: false });

        if (selectedLocation !== "all") {
          query = query.eq("location_id", selectedLocation);
        }

        const { data: metricsData } = await query;

        // Aggregate metrics by resource type
        const aggregated = (metricsData || []).reduce((acc: any, metric: any) => {
          const key = metric.resource_type;
          if (!acc[key]) {
            acc[key] = {
              resource_type: key,
              total_capacity: 0,
              total_utilized: 0,
              count: 0,
              location_name: metric.clinic_locations?.location_name,
            };
          }
          acc[key].total_capacity += metric.total_capacity_minutes;
          acc[key].total_utilized += metric.utilized_minutes;
          acc[key].count += 1;
          return acc;
        }, {});

        const metricsArray = Object.values(aggregated).map((m: any) => ({
          ...m,
          utilization_percentage:
            m.total_capacity > 0
              ? ((m.total_utilized / m.total_capacity) * 100).toFixed(1)
              : 0,
        }));

        setMetrics(metricsArray);
      }
    } catch (error) {
      console.error("Error loading capacity analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load capacity analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationStatus = (percentage: number) => {
    if (percentage >= 90) {
      return {
        icon: AlertCircle,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        label: "Critical - Near Capacity",
      };
    } else if (percentage >= 75) {
      return {
        icon: TrendingUp,
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
        label: "High Utilization",
      };
    } else if (percentage >= 50) {
      return {
        icon: CheckCircle2,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
        label: "Optimal",
      };
    } else {
      return {
        icon: TrendingDown,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        label: "Underutilized",
      };
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Capacity Analytics">
        <div className="flex items-center justify-center h-64">
          <p>Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Capacity Analytics">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Monitor resource utilization and identify bottlenecks
          </p>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.location_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => {
            const status = getUtilizationStatus(parseFloat(String(metric.utilization_percentage)));
            const StatusIcon = status.icon;

            return (
              <Card key={index} className={`${status.bg} border-2 ${status.border}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">
                      {metric.resource_type.replace(/_/g, " ")}
                    </span>
                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                  </CardTitle>
                  <CardDescription>{status.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Utilization</span>
                        <span className="font-bold">{metric.utilization_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            parseFloat(String(metric.utilization_percentage)) >= 90
                              ? "bg-red-600"
                              : parseFloat(String(metric.utilization_percentage)) >= 75
                              ? "bg-orange-500"
                              : parseFloat(String(metric.utilization_percentage)) >= 50
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${metric.utilization_percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Capacity</p>
                        <p className="font-semibold">
                          {Math.round(metric.total_capacity / 60)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Utilized</p>
                        <p className="font-semibold">
                          {Math.round(metric.total_utilized / 60)}h
                        </p>
                      </div>
                    </div>

                    {parseFloat(String(metric.utilization_percentage)) >= 90 && (
                      <div className="pt-2 border-t border-red-200">
                        <p className="text-xs text-red-700 font-medium">
                          ⚠️ Consider adding capacity or load balancing across locations
                        </p>
                      </div>
                    )}
                    {parseFloat(String(metric.utilization_percentage)) < 50 && (
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-xs text-blue-700 font-medium">
                          💡 Opportunity to increase bookings or consolidate resources
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {metrics.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No capacity data available yet. Metrics will appear as appointments are
                scheduled and resources are utilized.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Based on current utilization patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.some((m) => parseFloat(String(m.utilization_percentage)) >= 90) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Critical Bottleneck Detected:</strong> Some resources are at
                    90%+ utilization. Consider adding capacity, extending hours, or
                    redistributing load to underutilized locations.
                  </p>
                </div>
              )}
              {metrics.some(
                (m) =>
                  parseFloat(String(m.utilization_percentage)) >= 75 &&
                  parseFloat(String(m.utilization_percentage)) < 90
              ) && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>High Utilization:</strong> Monitor these resources closely as
                    they approach capacity limits.
                  </p>
                </div>
              )}
              {metrics.some((m) => parseFloat(String(m.utilization_percentage)) < 50) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Optimization Opportunity:</strong> Some resources are
                    underutilized. Consider consolidating services or increasing marketing
                    for available capacity.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
