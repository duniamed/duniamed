import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, Calendar, AlertTriangle, CheckCircle, XCircle, Brain, Database, Settings, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  return (
    <ProtectedRoute>
      <AdminPanelContent />
    </ProtectedRoute>
  );
}

function AdminPanelContent() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSpecialists: 0,
    pendingVerifications: 0,
    totalAppointments: 0,
  });
  const [pendingSpecialists, setPendingSpecialists] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: specialistsCount } = await supabase
        .from('specialists')
        .select('*', { count: 'exact', head: true });

      const { count: pendingCount } = await supabase
        .from('specialists')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      // Fetch pending specialists
      const { data: pending } = await supabase
        .from('specialists')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('verification_status', 'pending');

      setStats({
        totalUsers: usersCount || 0,
        totalSpecialists: specialistsCount || 0,
        pendingVerifications: pendingCount || 0,
        totalAppointments: appointmentsCount || 0,
      });

      setPendingSpecialists(pending || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (specialistId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('specialists')
        .update({
          verification_status: status,
          verified_at: status === 'verified' ? new Date().toISOString() : null,
        })
        .eq('id', specialistId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Specialist ${status}`,
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Admin Panel"
      description="Manage users, AI governance, and system settings"
    >
      {/* Admin Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/admin/ai-governance')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">AI Governance</CardTitle>
              <Brain className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configure AI behavior, sources, and compliance</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/admin/user-management')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">User Management</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage users, roles, and permissions</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/admin/audit-logs')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View system activity and security events</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Specialists</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSpecialists}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="verifications">
          <TabsList>
            <TabsTrigger value="verifications">
              Pending Verifications ({pendingSpecialists.length})
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="specialists">Specialists</TabsTrigger>
          </TabsList>

          <TabsContent value="verifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Specialist Verifications</CardTitle>
                <CardDescription>Review and approve specialist applications</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingSpecialists.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending verifications
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingSpecialists.map((specialist) => (
                        <TableRow key={specialist.id}>
                          <TableCell>
                            Dr. {specialist.profiles.first_name} {specialist.profiles.last_name}
                          </TableCell>
                          <TableCell>{specialist.profiles.email}</TableCell>
                          <TableCell>{specialist.license_number}</TableCell>
                          <TableCell>
                            {specialist.specialty.slice(0, 2).join(', ')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateVerificationStatus(specialist.id, 'verified')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateVerificationStatus(specialist.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">User management interface coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specialists">
            <Card>
              <CardHeader>
                <CardTitle>Specialist Management</CardTitle>
                <CardDescription>View and manage all specialists</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Specialist management interface coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </DashboardLayout>
  );
}
