import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, UserMinus, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface UserWithRoles {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  isAdmin: boolean;
}

export default function AdminUserManagement() {
  return (
    <ProtectedRoute>
      <AdminUserManagementContent />
    </ProtectedRoute>
  );
}

function AdminUserManagementContent() {
  const { toast } = useToast();
  const { user: currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserWithRoles[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only system admins can access this page',
        variant: 'destructive',
      });
      return;
    }
    fetchAdminUsers();
  }, [isAdmin]);

  const fetchAdminUsers = async () => {
    try {
      // Fetch all users with admin role from user_roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, granted_at, expires_at')
        .eq('role', 'admin')
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      if (rolesError) throw rolesError;

      const adminUserIds = adminRoles?.map(r => r.user_id) || [];

      if (adminUserIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Fetch profile details for admin users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role')
        .in('id', adminUserIds);

      if (profilesError) throw profilesError;

      const usersWithRoles: UserWithRoles[] = profiles?.map(p => ({
        ...p,
        isAdmin: true,
      })) || [];

      setUsers(usersWithRoles);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch admin users',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email to search',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role')
        .ilike('email', `%${searchEmail}%`)
        .limit(10);

      if (error) throw error;

      // Check which users have admin role
      const userIds = data?.map(u => u.id) || [];
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .in('user_id', userIds)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      const results: UserWithRoles[] = data?.map(u => ({
        ...u,
        isAdmin: adminUserIds.has(u.id),
      })) || [];

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    }
  };

  const grantAdminRole = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('grant_master_admin', {
        _user_id: userId,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Admin role granted successfully',
      });

      fetchAdminUsers();
      setSearchResults([]);
      setSearchEmail('');
    } catch (error: any) {
      console.error('Error granting admin role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to grant admin role',
        variant: 'destructive',
      });
    }
  };

  const revokeAdminRole = async (userId: string) => {
    if (userId === currentUser?.id && users.length <= 1) {
      toast({
        title: 'Cannot Revoke',
        description: 'You are the last admin. Create another admin first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('revoke_admin_role', {
        _user_id: userId,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Admin role revoked successfully',
      });

      fetchAdminUsers();
    } catch (error: any) {
      console.error('Error revoking admin role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke admin role',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout title="Access Denied">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You do not have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout title="Admin User Management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="👑 Admin User Management">
      <div className="space-y-6">
        {/* Current Admins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Current System Admins ({users.length})
            </CardTitle>
            <CardDescription>
              Users with master admin access to all system features
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No admin users found
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Profile Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => revokeAdminRole(user.id)}
                          disabled={user.id === currentUser?.id && users.length <= 1}
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Grant Admin Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Grant Admin Access
            </CardTitle>
            <CardDescription>
              Search for a user by email to grant admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                />
                <Button onClick={searchUser}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge className="bg-green-500">
                              <Shield className="h-3 w-3 mr-1" />
                              Already Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline">Regular User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!user.isAdmin && (
                            <Button
                              size="sm"
                              onClick={() => grantAdminRole(user.id)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Grant Admin
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Security Notice
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Master admin users have unrestricted access to all system features, including sensitive data.
                  Only grant this role to trusted individuals. All admin actions are logged in the security audit log.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
