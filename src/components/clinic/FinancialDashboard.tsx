import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface FinancialDashboardProps {
  clinicId: string;
}

export function FinancialDashboard({ clinicId }: FinancialDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadFinancialData();
  }, [clinicId, dateRange]);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clinic-financial-dashboard', {
        body: {
          clinicId,
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });

      if (error) throw error;

      if (data?.success) {
        setMetrics(data);
      }
    } catch (error: any) {
      console.error('Financial data error:', error);
      toast({
        title: "Load Failed",
        description: error.message || "Unable to load financial data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Dashboard</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadFinancialData}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.metrics.grossRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.metrics.totalAppointments} appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(metrics.metrics.collectedRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((metrics.metrics.collectedRevenue / metrics.metrics.grossRevenue) * 100).toFixed(1)}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(metrics.metrics.pendingRevenue)}
            </div>
            <Button size="sm" variant="outline" className="mt-2 w-full">
              Send Reminders
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.metrics.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.metrics.completedAppointments} / {metrics.metrics.totalAppointments} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Specialist */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.breakdown.bySpecialist).map(([specId, data]: [string, any]) => (
              <div key={specId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Provider {specId.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.appointments} appointments
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(data.revenue)}</p>
                  <Badge variant="outline" className="text-xs">
                    Avg: {formatCurrency(data.revenue / data.appointments)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Consultation Type */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Service Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.breakdown.byType).map(([type, data]: [string, any]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium capitalize">{type.replace('_', ' ')}</p>
                  <p className="text-sm text-muted-foreground">{data.count} appointments</p>
                </div>
                <p className="text-lg font-semibold">{formatCurrency(data.revenue)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}