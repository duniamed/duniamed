import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { GoLiveToggle } from './GoLiveToggle';
import { Calendar, DollarSign, Users, Clock } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [queueSize, setQueueSize] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
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

      // Load today's schedule
      const today = new Date().toISOString().split('T')[0];
      const { data: scheduleData } = await supabase.functions.invoke('generate-daily-schedule-snapshot', {
        body: { specialistId: specialist.id, date: today }
      });

      if (scheduleData) {
        setTodaySchedule(scheduleData.appointments || []);
      }

      // Load earnings snapshot
      const { data: earningsData } = await supabase.functions.invoke('calculate-earnings-snapshot', {
        body: { userId: user.id, userType: 'specialist', periodType: 'daily' }
      });

      if (earningsData) {
        setEarnings(earningsData.snapshot);
      }

      // Load queue size (placeholder)
      setQueueSize(0);

    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Doctor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySchedule.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueSize}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${earnings?.total_earnings?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {todaySchedule[0] ? new Date(todaySchedule[0].scheduled_at).toLocaleTimeString() : 'None'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {todaySchedule.length > 0 ? (
            <div className="space-y-2">
              {todaySchedule.map((apt: any) => (
                <div key={apt.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{apt.patient_name}</div>
                    <div className="text-sm text-muted-foreground">{apt.chief_complaint}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{new Date(apt.scheduled_at).toLocaleTimeString()}</div>
                    <div className="text-sm text-muted-foreground">{apt.duration_minutes} min</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No appointments scheduled for today
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
