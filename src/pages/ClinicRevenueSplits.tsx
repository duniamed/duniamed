import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, Edit, Check, X } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface SpecialistMember {
  id: string;
  specialist_id: string;
  revenue_share_percentage: number;
  role: string;
  is_active: boolean;
  specialists: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function ClinicRevenueSplits() {
  return (
    <ProtectedRoute>
      <ClinicRevenueSplitsContent />
    </ProtectedRoute>
  );
}

function ClinicRevenueSplitsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clinic, setClinic] = useState<any>(null);
  const [members, setMembers] = useState<SpecialistMember[]>([]);
  const [splits, setSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPercentage, setEditPercentage] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch clinic
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('*')
        .eq('created_by', user.id)
        .single();

      if (!clinicData) return;
      setClinic(clinicData);

      // Fetch clinic members with specialists
      const { data: membersData } = await supabase
        .from('specialist_clinics')
        .select(`
          *,
          specialists(
            profiles:user_id(first_name, last_name)
          )
        `)
        .eq('clinic_id', clinicData.id)
        .eq('is_active', true);

      if (membersData) {
        setMembers(membersData as any);
      }

      // Fetch recent revenue splits (cast to any since types aren't updated yet)
      const { data: splitsData } = await (supabase as any)
        .from('clinic_revenue_splits')
        .select('*')
        .eq('clinic_id', clinicData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (splitsData) {
        // Manually fetch related data since types aren't updated yet
        const enrichedSplits = await Promise.all(
          splitsData.map(async (split: any) => {
            const { data: specialistData } = await supabase
              .from('specialists')
              .select('user_id')
              .eq('id', split.specialist_id)
              .single();
            
            if (specialistData) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', specialistData.user_id)
                .single();
              
              return {
                ...split,
                specialists: { profiles: profileData || { first_name: '', last_name: '' } }
              };
            }
            return {
              ...split,
              specialists: { profiles: { first_name: '', last_name: '' } }
            };
          })
        );
        setSplits(enrichedSplits);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (member: SpecialistMember) => {
    setEditingId(member.id);
    setEditPercentage(member.revenue_share_percentage?.toString() || '50');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPercentage('');
  };

  const savePercentage = async (memberId: string) => {
    const percentage = parseFloat(editPercentage);
    
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: 'Invalid Percentage',
        description: 'Please enter a value between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('specialist_clinics')
        .update({ revenue_share_percentage: percentage })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Revenue split updated successfully',
      });

      setEditingId(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const totalRevenue = splits.reduce((acc, split) => acc + parseFloat(split.total_amount || 0), 0);
  const totalClinicAmount = splits.reduce((acc, split) => acc + parseFloat(split.clinic_amount || 0), 0);
  const totalSpecialistAmount = splits.reduce((acc, split) => acc + parseFloat(split.specialist_amount || 0), 0);

  if (loading) {
    return (
      <DashboardLayout title="Revenue Management" description="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Revenue Management" 
      description="Manage revenue splits for your clinic specialists"
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Last 20 transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clinic Share</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalClinicAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From recent splits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Specialist Share</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpecialistAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Distributed to specialists</p>
            </CardContent>
          </Card>
        </div>

        {/* Specialist Revenue Splits Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Specialist Revenue Splits</CardTitle>
            <CardDescription>
              Configure revenue share percentage for each specialist (0-100%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Specialist</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Revenue Share %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      Dr. {member.specialists.profiles.first_name}{' '}
                      {member.specialists.profiles.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {editingId === member.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={editPercentage}
                            onChange={(e) => setEditPercentage(e.target.value)}
                            className="w-24"
                          />
                          <span>%</span>
                        </div>
                      ) : (
                        <span className="font-semibold">
                          {member.revenue_share_percentage || 50}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === member.id ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => savePercentage(member.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No specialists in this clinic yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Revenue Splits */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Revenue Splits</CardTitle>
            <CardDescription>Transaction history and payment distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Specialist</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Clinic Share</TableHead>
                  <TableHead>Specialist Share</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {splits.map((split) => (
                  <TableRow key={split.id}>
                    <TableCell>
                      {new Date(split.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      Dr. {split.specialists.profiles.first_name}{' '}
                      {split.specialists.profiles.last_name}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${parseFloat(split.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      ${parseFloat(split.clinic_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      ${parseFloat(split.specialist_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          split.payment_status === 'paid'
                            ? 'default'
                            : split.payment_status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {split.payment_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {splits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No revenue splits recorded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
