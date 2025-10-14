import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, TrendingUp, Building } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const PhysicalClinicDashboard: React.FC<{ clinicId: string }> = ({ clinicId }) => {
  const { data: clinic } = useQuery({
    queryKey: ['clinic', clinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();
      return data;
    }
  });

  const { data: staff } = useQuery({
    queryKey: ['clinic-staff', clinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from('clinic_staff')
        .select('*, profiles(*)')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);
      return data || [];
    }
  });

  const { data: todayAppointments } = useQuery({
    queryKey: ['clinic-appointments-today', clinicId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('scheduled_at', `${today}T00:00:00`)
        .lt('scheduled_at', `${today}T23:59:59`);
      return data || [];
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{clinic?.name}</h1>
          <p className="text-muted-foreground">{clinic?.description}</p>
        </div>
        <Building className="h-12 w-12 text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Doctors, nurses, admin staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              In-person and telehealth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Resource capacity used
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staff?.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {member.profiles?.first_name} {member.profiles?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {member.employment_type}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
