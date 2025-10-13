import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, TrendingUp, Users, Clock } from 'lucide-react';

interface UtilizationData {
  specialistName: string;
  totalSlots: number;
  bookedSlots: number;
  utilizationRate: number;
  revenue: number;
  noShowRate: number;
}

export function CapacityAnalyticsWidget() {
  const [data, setData] = useState<UtilizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [peakHours, setPeakHours] = useState<any[]>([]);

  useEffect(() => {
    loadCapacityData();
  }, []);

  const loadCapacityData = async () => {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch specialists with their appointments for today
      const { data: specialists, error } = await supabase
        .from('specialists')
        .select(`
          id,
          user_id,
          profiles!specialists_user_id_fkey (
            first_name,
            last_name
          ),
          appointments!appointments_specialist_id_fkey (
            id,
            scheduled_at,
            status,
            fee
          )
        `);

      if (error) throw error;

      // Calculate utilization for each specialist
      const utilizationData: UtilizationData[] = specialists?.map((spec: any) => {
        const todayAppointments = spec.appointments.filter((apt: any) => 
          apt.scheduled_at.startsWith(today)
        );
        
        const bookedSlots = todayAppointments.length;
        const completedAppointments = todayAppointments.filter((apt: any) => 
          apt.status === 'completed'
        );
        const noShowAppointments = todayAppointments.filter((apt: any) => 
          apt.status === 'no_show'
        );
        
        const totalSlots = 16; // Assume 8 hour day with 30 min slots
        const utilizationRate = (bookedSlots / totalSlots) * 100;
        const revenue = completedAppointments.reduce((sum: number, apt: any) => 
          sum + (apt.fee || 0), 0
        );
        const noShowRate = bookedSlots > 0 ? (noShowAppointments.length / bookedSlots) * 100 : 0;

        return {
          specialistName: `${spec.profiles.first_name} ${spec.profiles.last_name}`,
          totalSlots,
          bookedSlots,
          utilizationRate: Math.round(utilizationRate),
          revenue,
          noShowRate: Math.round(noShowRate)
        };
      }) || [];

      setData(utilizationData);

      // Calculate peak hours
      const hourCounts = new Array(24).fill(0);
      specialists?.forEach((spec: any) => {
        spec.appointments.forEach((apt: any) => {
          if (apt.scheduled_at.startsWith(today)) {
            const hour = new Date(apt.scheduled_at).getHours();
            hourCounts[hour]++;
          }
        });
      });

      const peaks = hourCounts
        .map((count, hour) => ({ hour, count }))
        .filter(h => h.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setPeakHours(peaks);
    } catch (error) {
      console.error('Error loading capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getUtilizationVariant = (rate: number): "default" | "secondary" | "destructive" => {
    if (rate >= 80) return 'default';
    if (rate >= 50) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Capacity Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const avgUtilization = data.length > 0 
    ? Math.round(data.reduce((sum, d) => sum + d.utilizationRate, 0) / data.length)
    : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Today's Capacity Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Average Utilization</div>
              <div className="text-3xl font-bold">{avgUtilization}%</div>
              <Progress value={avgUtilization} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Appointments</div>
              <div className="text-3xl font-bold">
                {data.reduce((sum, d) => sum + d.bookedSlots, 0)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Revenue (Today)</div>
              <div className="text-3xl font-bold">
                ${data.reduce((sum, d) => sum + d.revenue, 0).toFixed(0)}
              </div>
            </div>
          </div>

          {peakHours.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Peak Hours Today</span>
              </div>
              <div className="flex gap-2">
                {peakHours.map(({ hour, count }) => (
                  <Badge key={hour} variant="secondary">
                    {hour}:00 - {count} appointments
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Specialist Utilization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.map((specialist, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{specialist.specialistName}</span>
                <Badge variant={getUtilizationVariant(specialist.utilizationRate)}>
                  {specialist.utilizationRate}%
                </Badge>
              </div>
              <Progress value={specialist.utilizationRate} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{specialist.bookedSlots} / {specialist.totalSlots} slots</span>
                <span>${specialist.revenue.toFixed(0)} revenue</span>
                <span>{specialist.noShowRate}% no-show</span>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No appointment data available for today</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
