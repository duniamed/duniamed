import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function Analytics() {
  return <AnalyticsContent />;
}

function AnalyticsContent() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalRevenue: 0,
    totalPatients: 0,
    avgRating: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      // Get specialist ID if user is a specialist
      let specialistId = null;
      if (profile?.role === 'specialist') {
        const { data } = await supabase
          .from('specialists')
          .select('id')
          .eq('user_id', user.id)
          .single();
        specialistId = data?.id;
      }

      // Fetch total appointments
      const appointmentsQuery = supabase
        .from('appointments')
        .select('*', { count: 'exact' });
      
      if (specialistId) {
        appointmentsQuery.eq('specialist_id', specialistId);
      }

      const { count: totalAppointments } = await appointmentsQuery;

      // Fetch unique patients
      const patientsQuery = supabase
        .from('appointments')
        .select('patient_id');
      
      if (specialistId) {
        patientsQuery.eq('specialist_id', specialistId);
      }

      const { data: patientData } = await patientsQuery;
      const uniquePatients = new Set(patientData?.map(a => a.patient_id)).size;

      // Fetch rating if specialist
      let avgRating = 0;
      if (specialistId) {
        const { data: specialistData } = await supabase
          .from('specialists')
          .select('average_rating')
          .eq('id', specialistId)
          .single();
        avgRating = specialistData?.average_rating || 0;
      }

      // Fetch monthly data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyQuery = supabase
        .from('appointments')
        .select('scheduled_at, status')
        .gte('scheduled_at', sixMonthsAgo.toISOString());

      if (specialistId) {
        monthlyQuery.eq('specialist_id', specialistId);
      }

      const { data: appointments } = await monthlyQuery;

      // Group by month
      const monthlyMap = new Map();
      appointments?.forEach(apt => {
        const month = new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
      });

      const monthlyDataArray = Array.from(monthlyMap.entries()).map(([month, count]) => ({
        month,
        appointments: count,
      }));

      // Group by status
      const statusMap = new Map();
      appointments?.forEach(apt => {
        statusMap.set(apt.status, (statusMap.get(apt.status) || 0) + 1);
      });

      const statusDataArray = Array.from(statusMap.entries()).map(([status, value]) => ({
        name: status,
        value,
      }));

      setStats({
        totalAppointments: totalAppointments || 0,
        totalRevenue: 0, // Would calculate from payments
        totalPatients: uniquePatients,
        avgRating,
      });

      setMonthlyData(monthlyDataArray);
      setStatusData(statusDataArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Appointments</CardTitle>
              <CardDescription>Appointments over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="appointments" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Status</CardTitle>
              <CardDescription>Distribution by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
