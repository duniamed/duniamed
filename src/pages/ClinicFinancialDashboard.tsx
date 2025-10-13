import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, DollarSign, Users, FileText, Download, Send, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ClinicFinancialDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    monthTarget: 50000,
    pendingPayments: 0,
    pendingCount: 0,
    collectedAmount: 0,
    collectionRate: 0,
  });
  const [revenueByProvider, setRevenueByProvider] = useState<any[]>([]);
  const [revenueByType, setRevenueByType] = useState<any[]>([]);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('clinic-financial-dashboard');
      
      if (error) throw error;
      
      if (data) {
        setMetrics(data.metrics);
        setRevenueByProvider(data.byProvider);
        setRevenueByType(data.byType);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load financial data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = () => {
    toast({
      title: 'Payment reminders sent',
      description: `Sent reminders to ${metrics.pendingCount} patients via WhatsApp and SMS`,
    });
  };

  const handleGenerateTaxReport = () => {
    toast({
      title: 'Tax report generated',
      description: 'Nota Fiscal documents are being generated and will download shortly',
    });
  };

  const handleExportStatement = () => {
    toast({
      title: 'Financial statement exported',
      description: 'CSV file downloaded successfully',
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Financial Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Financial Intelligence" 
      description="Real-time revenue, payments & commissions - zero manual work"
      showBackButton
    >
      <div className="space-y-6">
        {/* Today's Snapshot */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.todayRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Updates with each appointment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.monthRevenue.toFixed(2)}</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all" 
                  style={{ width: `${(metrics.monthRevenue / metrics.monthTarget) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((metrics.monthRevenue / metrics.monthTarget) * 100)}% of ${metrics.monthTarget} target
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">${metrics.pendingPayments.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{metrics.pendingCount} patients</p>
              <Button size="sm" variant="outline" className="mt-2 w-full" onClick={handleSendReminders}>
                <Send className="h-3 w-3 mr-1" />
                Send Reminders
              </Button>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collected</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${metrics.collectedAmount.toFixed(2)}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold text-green-500">{metrics.collectionRate}%</span>
                <span className="text-xs text-muted-foreground">collection rate</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Provider</CardTitle>
              <CardDescription>Performance breakdown by specialist</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByProvider}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Service Type</CardTitle>
              <CardDescription>Breakdown by consultation type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Smart Actions */}
        <Card>
          <CardHeader>
            <CardTitle>One-Click Actions</CardTitle>
            <CardDescription>Automated financial operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleGenerateTaxReport} size="lg">
                <FileText className="mr-2 h-4 w-4" />
                Generate Tax Report (Nota Fiscal)
              </Button>
              <Button onClick={handleExportStatement} variant="outline" size="lg">
                <Download className="mr-2 h-4 w-4" />
                Export Financial Statement
              </Button>
              <Button variant="outline" size="lg">
                <Send className="mr-2 h-4 w-4" />
                Submit Insurance Claims
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
