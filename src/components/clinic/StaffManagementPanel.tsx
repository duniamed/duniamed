import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface StaffManagementPanelProps {
  clinicId: string;
}

export const StaffManagementPanel: React.FC<StaffManagementPanelProps> = ({ clinicId }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    user_id: '',
    role: 'nurse',
    employment_type: 'full_time'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff } = useQuery({
    queryKey: ['clinic-staff', clinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from('clinic_staff')
        .select('*, profiles(*)')
        .eq('clinic_id', clinicId);
      return data || [];
    }
  });

  const addStaffMutation = useMutation({
    mutationFn: async (staffData: any) => {
      const { data, error } = await supabase.functions.invoke('manage-clinic-staff', {
        body: {
          action: 'add_staff',
          clinicId,
          staffData
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Staff Added",
        description: "New staff member has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['clinic-staff', clinicId] });
      setShowAddForm(false);
      setNewStaff({ user_id: '', role: 'nurse', employment_type: 'full_time' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const removeStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const { data, error } = await supabase.functions.invoke('manage-clinic-staff', {
        body: {
          action: 'remove_staff',
          clinicId,
          staffData: { staff_id: staffId }
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Staff Removed",
        description: "Staff member has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['clinic-staff', clinicId] });
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Staff Management</CardTitle>
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <Input
              placeholder="User ID"
              value={newStaff.user_id}
              onChange={(e) => setNewStaff({ ...newStaff, user_id: e.target.value })}
            />
            <Select
              value={newStaff.role}
              onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="receptionist">Receptionist</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={newStaff.employment_type}
              onValueChange={(value) => setNewStaff({ ...newStaff, employment_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => addStaffMutation.mutate(newStaff)} className="w-full">
              Add Staff Member
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {staff?.map((member: any) => (
            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">
                  {member.profiles?.first_name} {member.profiles?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {member.role} • {member.employment_type}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeStaffMutation.mutate(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
