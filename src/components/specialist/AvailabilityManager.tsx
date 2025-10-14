import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityManagerProps {
  specialistId: string;
}

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ specialistId }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules } = useQuery({
    queryKey: ['availability', specialistId],
    queryFn: async () => {
      const { data } = await supabase
        .from('availability_schedules')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('is_active', true)
        .order('day_of_week');
      return data || [];
    }
  });

  const addScheduleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('availability_schedules')
        .insert({
          specialist_id: specialistId,
          day_of_week: newSlot.day_of_week,
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          is_active: true
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Availability Added",
        description: "New time slot has been added to your schedule",
      });
      queryClient.invalidateQueries({ queryKey: ['availability', specialistId] });
      setShowAddForm(false);
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('availability_schedules')
        .update({ is_active: false })
        .eq('id', scheduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Availability Removed",
        description: "Time slot has been removed from your schedule",
      });
      queryClient.invalidateQueries({ queryKey: ['availability', specialistId] });
    }
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Weekly Availability
          </CardTitle>
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Slot
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showAddForm && (
          <div className="p-4 border rounded-lg space-y-4">
            <div>
              <Label>Day of Week</Label>
              <Select
                value={newSlot.day_of_week.toString()}
                onValueChange={(value) =>
                  setNewSlot({ ...newSlot, day_of_week: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayNames.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, start_time: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, end_time: e.target.value })
                  }
                />
              </div>
            </div>

            <Button
              onClick={() => addScheduleMutation.mutate()}
              disabled={addScheduleMutation.isPending}
              className="w-full"
            >
              Add to Schedule
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {schedules?.map((schedule: any) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">{dayNames[schedule.day_of_week]}</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.start_time} - {schedule.end_time}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteScheduleMutation.mutate(schedule.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {(!schedules || schedules.length === 0) && !showAddForm && (
            <div className="text-center py-8 text-muted-foreground">
              No availability set. Add your first time slot.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
