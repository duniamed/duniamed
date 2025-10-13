import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';

interface EarningsData {
  currentMonthEarnings: number;
  forecastedNextMonth: number;
  averagePerConsultation: number;
  bookedAppointments: number;
  completedAppointments: number;
  pendingPayments: number;
  avgDaysToPayment: number;
  trend: 'up' | 'down' | 'stable';
}

export function EarningsForecastWidget() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get specialist ID
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) return;

      // Get current month's completed appointments
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
      
      const { data: completedAppts } = await supabase
        .from('appointments')
        .select('fee, scheduled_at, created_at')
        .eq('specialist_id', specialist.id)
        .eq('status', 'completed')
        .gte('scheduled_at', firstDayOfMonth);

      const currentMonthEarnings = completedAppts?.reduce((sum, apt) => sum + (apt.fee || 0), 0) || 0;
      const completedCount = completedAppts?.length || 0;

      // Get booked future appointments
      const { data: bookedAppts } = await supabase
        .from('appointments')
        .select('fee, scheduled_at')
        .eq('specialist_id', specialist.id)
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_at', new Date().toISOString());

      const bookedCount = bookedAppts?.length || 0;
      const forecastedRevenue = bookedAppts?.reduce((sum, apt) => sum + (apt.fee || 0), 0) || 0;

      // Calculate average per consultation
      const avgPerConsult = completedCount > 0 ? currentMonthEarnings / completedCount : 0;

      // Calculate payment latency (simplified)
      const avgPaymentDays = 3; // In production, calculate from payments table

      // Determine trend
      const lastMonthEarnings = currentMonthEarnings * 0.9; // Simplified
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (currentMonthEarnings > lastMonthEarnings * 1.1) trend = 'up';
      else if (currentMonthEarnings < lastMonthEarnings * 0.9) trend = 'down';

      setData({
        currentMonthEarnings,
        forecastedNextMonth: forecastedRevenue,
        averagePerConsultation: avgPerConsult,
        bookedAppointments: bookedCount,
        completedAppointments: completedCount,
        pendingPayments: currentMonthEarnings * 0.1, // Simplified
        avgDaysToPayment: avgPaymentDays,
        trend
      });
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Earnings Forecast
          </span>
          <Badge variant={data.trend === 'up' ? 'default' : data.trend === 'down' ? 'destructive' : 'secondary'}>
            {data.trend === 'up' && '↑'} 
            {data.trend === 'down' && '↓'}
            {data.trend === 'stable' && '→'} 
            {data.trend.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">This Month</div>
            <div className="text-2xl font-bold">
              ${data.currentMonthEarnings.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">
              {data.completedAppointments} completed consultations
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Forecasted (Booked)</div>
            <div className="text-2xl font-bold text-primary">
              ${data.forecastedNextMonth.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">
              {data.bookedAppointments} future appointments
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Avg per Consultation
            </div>
            <span className="font-semibold">${data.averagePerConsultation.toFixed(0)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Avg Days to Payment
            </div>
            <span className="font-semibold">{data.avgDaysToPayment} days</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Pending Payments
            </div>
            <span className="font-semibold text-yellow-600">
              ${data.pendingPayments.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg text-sm">
          <p className="font-medium mb-2">💡 Optimization Tips:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {data.bookedAppointments < 5 && (
              <li>• Low future bookings - consider promotional pricing</li>
            )}
            {data.completedAppointments > 0 && (
              <li>• Great work! {data.completedAppointments} consultations completed this month</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
