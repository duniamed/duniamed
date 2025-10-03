import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Calendar, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RevenueSplitsDashboard() {
  const [splits, setSplits] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    clinicAmount: 0,
    specialistAmount: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("current_month");
  const [role, setRole] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [periodFilter]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(profile?.role || "");

      // Calculate date range
      const now = new Date();
      let startDate, endDate;

      if (periodFilter === "current_month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (periodFilter === "last_month") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
      }

      // Load revenue splits
      let query = supabase
        .from("revenue_splits")
        .select(`
          *,
          specialists(user_id, specialty),
          clinics(name),
          appointments(consultation_type, scheduled_at)
        `)
        .gte("period_start", startDate.toISOString())
        .lte("period_end", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (profile?.role === "specialist") {
        const { data: specialist } = await supabase
          .from("specialists")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (specialist) {
          query = query.eq("specialist_id", specialist.id);
        }
      } else if (profile?.role === "clinic_admin") {
        const { data: clinic } = await supabase
          .from("clinics")
          .select("id")
          .eq("created_by", user.id)
          .single();

        if (clinic) {
          query = query.eq("clinic_id", clinic.id);
        }
      }

      const { data: splitsData } = await query;
      setSplits(splitsData || []);

      // Calculate summary
      const total = splitsData?.reduce((sum, s) => sum + parseFloat(String(s.total_amount)), 0) || 0;
      const clinicTotal = splitsData?.reduce((sum, s) => sum + parseFloat(String(s.clinic_amount)), 0) || 0;
      const specialistTotal = splitsData?.reduce((sum, s) => sum + parseFloat(String(s.specialist_amount)), 0) || 0;
      const pending = splitsData?.filter((s) => s.status === "pending").length || 0;

      setSummary({
        totalRevenue: total,
        clinicAmount: clinicTotal,
        specialistAmount: specialistTotal,
        pendingCount: pending,
      });
    } catch (error) {
      console.error("Error loading revenue splits:", error);
      toast({
        title: "Error",
        description: "Failed to load revenue data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Revenue Splits">
        <div className="flex items-center justify-center h-64">
          <p>Loading revenue data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Revenue Splits">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Track revenue distribution across specialists and clinic
          </p>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="current_year">Current Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clinic Share</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.clinicAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.totalRevenue > 0
                  ? `${((summary.clinicAmount / summary.totalRevenue) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Specialist Share</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.specialistAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.totalRevenue > 0
                  ? `${((summary.specialistAmount / summary.totalRevenue) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Split Details</CardTitle>
            <CardDescription>Detailed breakdown of revenue distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {splits.map((split) => (
                <div
                  key={split.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{split.service_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(split.appointments?.scheduled_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-8 text-right">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-semibold">
                        ${parseFloat(split.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clinic ({split.clinic_percentage}%)</p>
                      <p className="font-semibold">
                        ${parseFloat(split.clinic_amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Specialist ({split.specialist_percentage}%)</p>
                      <p className="font-semibold">
                        ${parseFloat(split.specialist_amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          split.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {split.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {splits.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No revenue splits found for the selected period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
