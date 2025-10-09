import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Activity, MousePointerClick } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState<any>({
    totalEvents: 0,
    uniqueUsers: 0,
    topEvents: [],
    eventsTrend: []
  });

  const loadAnalytics = async () => {
    try {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
      const since = new Date();
      since.setDate(since.getDate() - daysAgo);

      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const totalEvents = events?.length || 0;
      const uniqueUsers = new Set(events?.map(e => e.user_id).filter(Boolean)).size;

      // Top events
      const eventCounts = events?.reduce((acc: any, event) => {
        acc[event.event_name] = (acc[event.event_name] || 0) + 1;
        return acc;
      }, {});

      const topEvents = Object.entries(eventCounts || {})
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      // Events trend by day
      const dayGroups = events?.reduce((acc: any, event) => {
        const day = new Date(event.created_at).toLocaleDateString();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const eventsTrend = Object.entries(dayGroups || {})
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setStats({ totalEvents, uniqueUsers, topEvents, eventsTrend });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalEvents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique Users</p>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Events/Day</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.eventsTrend.length > 0
                  ? Math.round(stats.totalEvents / stats.eventsTrend.length)
                  : 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Events Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.eventsTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top Events</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.topEvents}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}