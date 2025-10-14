import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const VirtualClinicDashboard: React.FC = () => {
  const [clinicData, setClinicData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [sharedQueue, setSharedQueue] = useState<any[]>([]);

  useEffect(() => {
    loadClinicData();
  }, []);

  const loadClinicData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clinic } = await supabase
        .from('clinics')
        .select('*')
        .eq('created_by', user.id)
        .eq('clinic_type', 'virtual')
        .single();

      if (!clinic) return;

      setClinicData(clinic);

      // Load clinic members
      const { data: membersData } = await supabase
        .from('clinic_staff')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('clinic_id', clinic.id)
        .eq('is_active', true);

      setMembers(membersData || []);

      // Load shared queue (placeholder)
      setSharedQueue([]);

    } catch (error) {
      console.error('Load clinic data error:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Virtual Clinic Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Queue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sharedQueue.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Shared Queue</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Shared Patient Queue</CardTitle>
            </CardHeader>
            <CardContent>
              {sharedQueue.length > 0 ? (
                <div className="space-y-2">
                  {sharedQueue.map((patient) => (
                    <div key={patient.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {patient.profiles?.first_name} {patient.profiles?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">{patient.chief_complaint}</div>
                      </div>
                      <div className="text-sm font-medium">Priority: {patient.priority}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No patients in queue
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {member.profiles?.first_name} {member.profiles?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{member.profiles?.email}</div>
                    </div>
                    <div className="text-sm font-medium">{member.role}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Collaborative Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Analytics coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
