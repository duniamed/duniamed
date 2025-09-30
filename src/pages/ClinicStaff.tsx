import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Trash2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function ClinicStaff() {
  return (
    <ProtectedRoute>
      <ClinicStaffContent />
    </ProtectedRoute>
  );
}

function ClinicStaffContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clinic, setClinic] = useState<any>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchClinicAndStaff();
  }, [user]);

  const fetchClinicAndStaff = async () => {
    if (!user) return;

    const { data: clinicData } = await supabase
      .from('clinics')
      .select('*')
      .eq('created_by', user.id)
      .single();

    if (clinicData) {
      setClinic(clinicData);

      const { data: staffData } = await supabase
        .from('clinic_staff')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('clinic_id', clinicData.id);

      if (staffData) {
        setStaff(staffData as any);
      }
    }

    setLoading(false);
  };

  const handleInviteStaff = async () => {
    if (!clinic || !inviteEmail) return;

    setInviting(true);

    const { data: userData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail)
      .single();

    if (!userData) {
      toast({
        title: 'User not found',
        description: 'Please ensure the user has registered on the platform first.',
        variant: 'destructive',
      });
      setInviting(false);
      return;
    }

    const { error } = await supabase
      .from('clinic_staff')
      .insert({
        clinic_id: clinic.id,
        user_id: userData.id,
        role: inviteRole,
        is_active: true,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add staff member.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Staff member added successfully.',
      });
      setInviteEmail('');
      setInviteRole('staff');
      fetchClinicAndStaff();
    }

    setInviting(false);
  };

  const handleRemoveStaff = async (staffId: string) => {
    const { error } = await supabase
      .from('clinic_staff')
      .update({ is_active: false })
      .eq('id', staffId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove staff member.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Staff member removed successfully.',
      });
      fetchClinicAndStaff();
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
    <DashboardLayout title="Staff Management" description="Manage your clinic's staff members">
      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Staff Member
            </CardTitle>
            <CardDescription>Add new team members to your clinic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="staff@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="specialist">Specialist</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleInviteStaff}
                    disabled={inviting || !inviteEmail}
                    className="w-full"
                  >
                    {inviting ? 'Adding...' : 'Add Staff'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Staff ({staff.filter(s => s.is_active).length})</CardTitle>
              <CardDescription>Manage your clinic's team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staff.filter(s => s.is_active).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {member.profiles?.first_name?.[0]}
                        {member.profiles?.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.profiles?.first_name} {member.profiles?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{member.role}</Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveStaff(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {staff.filter(s => s.is_active).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No staff members yet. Invite your first team member above.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }