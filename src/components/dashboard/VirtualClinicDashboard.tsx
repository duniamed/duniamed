import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Activity, TrendingUp, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const VirtualClinicDashboard: React.FC = () => {
  const [clinicData, setClinicData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [sharedQueue, setSharedQueue] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({ totalPatients: 0, revenue: 0, activeMembers: 0 });
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get clinic
    const { data: clinic } = await supabase
      .from('clinics')
      .select('*')
      .eq('created_by', user.id)
      .eq('clinic_type', 'virtual')
      .single();

    if (!clinic) return;
    setClinicData(clinic);

    // Get team members
    const { data: teamMembers } = await supabase
      .from('clinic_staff')
      .select('*, profiles(*)')
      .eq('clinic_id', clinic.id)
      .eq('is_active', true);

    setMembers(teamMembers || []);

    // Get shared queue - using any to bypass type issues with patient_queue table
    const { data: queue } = await (supabase as any)
      .from('patient_queue')
      .select('*')
      .eq('clinic_id', clinic.id)
      .eq('status', 'waiting')
      .order('created_at');

    setSharedQueue(queue || []);

    // Calculate analytics
    const { data: appointments } = await supabase
      .from('appointments')
      .select('patient_id, fee')
      .eq('clinic_id', clinic.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const uniquePatients = new Set(appointments?.map(a => a.patient_id)).size;
    const totalRevenue = appointments?.reduce((sum, a) => sum + Number(a.fee), 0) || 0;

    setAnalytics({
      totalPatients: uniquePatients,
      revenue: totalRevenue,
      activeMembers: teamMembers?.length || 0
    });
  };

  const inviteMember = async () => {
    toast({ title: 'Invite Member', description: 'Opening invite dialog...' });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{clinicData?.name || 'Virtual Clinic'}</h1>
          <p className="text-muted-foreground">Collaborative healthcare delivery</p>
        </div>
        <Button onClick={inviteMember}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeMembers}</div>
            <p className="text-xs text-muted-foreground">Healthcare providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Queue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sharedQueue.length}</div>
            <p className="text-xs text-muted-foreground">Patients waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Monthly total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{member.profiles?.first_name} {member.profiles?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                  <Badge variant={member.is_active ? 'default' : 'secondary'}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shared Patient Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sharedQueue.length === 0 ? (
                <p className="text-muted-foreground">No patients in queue</p>
              ) : (
                sharedQueue.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Patient #{patient.queue_position}</p>
                      <p className="text-sm text-muted-foreground">
                        Waiting {Math.floor((Date.now() - new Date(patient.created_at).getTime()) / 60000)} mins
                      </p>
                    </div>
                    <Button size="sm">Accept</Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
