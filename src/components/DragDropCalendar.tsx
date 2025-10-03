import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { format, addDays, startOfWeek, addMinutes } from 'date-fns';

/**
 * C18 CALENDARS - Drag & Drop Calendar
 * Specialists manage availability with intuitive drag-drop interface
 */

interface TimeSlot {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export function DragDropCalendar({ specialistId }: { specialistId: string }) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [draggedSlot, setDraggedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  useEffect(() => {
    fetchAvailability();
  }, [specialistId]);

  const fetchAvailability = async () => {
    try {
      const { data } = await supabase
        .from('availability_schedules')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('is_active', true);

      const mappedSlots: TimeSlot[] = (data || []).map((schedule) => ({
        id: schedule.id,
        day: schedule.day_of_week,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        isAvailable: true
      }));

      setSlots(mappedSlots);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (slot: TimeSlot) => {
    setDraggedSlot(slot);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (day: number, hour: number) => {
    if (!draggedSlot) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate new times
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

      // Update in database
      const { error } = await supabase
        .from('availability_schedules')
        .update({
          day_of_week: day,
          start_time: startTime,
          end_time: endTime
        })
        .eq('id', draggedSlot.id);

      if (error) throw error;

      // Log the change for undo
      await (supabase as any)
        .from('availability_changes_log')
        .insert({
          specialist_id: specialistId,
          change_type: 'move_slot',
          old_value: { ...draggedSlot },
          new_value: { day, startTime, endTime },
          changed_by: user.id,
          can_undo: true
        });

      toast({
        title: "Slot Moved",
        description: "Availability updated successfully",
      });

      fetchAvailability();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    } finally {
      setDraggedSlot(null);
    }
  };

  const handleAddSlot = async (day: number, hour: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

      const { error } = await supabase
        .from('availability_schedules')
        .insert({
          specialist_id: specialistId,
          day_of_week: day,
          start_time: startTime,
          end_time: endTime,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Slot Added",
        description: "New availability slot created",
      });

      fetchAvailability();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add slot",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('availability_schedules')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Slot Deleted",
        description: "Availability slot removed",
      });

      fetchAvailability();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete slot",
        variant: "destructive",
      });
    }
  };

  const getSlotForCell = (day: number, hour: number) => {
    return slots.find(slot => {
      const slotHour = parseInt(slot.startTime.split(':')[0]);
      return slot.day === day && slotHour === hour;
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading calendar...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-sm font-medium w-24">Time</th>
                {daysOfWeek.map((day, idx) => (
                  <th key={idx} className="p-2 text-center text-sm font-medium">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour} className="border-t">
                  <td className="p-2 text-sm text-muted-foreground">
                    {hour}:00
                  </td>
                  {daysOfWeek.map((_, dayIdx) => {
                    const slot = getSlotForCell(dayIdx, hour);
                    
                    return (
                      <td
                        key={dayIdx}
                        className="p-1 border-l relative"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(dayIdx, hour)}
                      >
                        {slot ? (
                          <div
                            draggable
                            onDragStart={() => handleDragStart(slot)}
                            className="bg-primary/20 hover:bg-primary/30 rounded p-2 cursor-move group relative"
                          >
                            <div className="flex items-center justify-between">
                              <GripVertical className="h-3 w-3 opacity-50" />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => handleDeleteSlot(slot.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              Available
                            </Badge>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-full opacity-0 hover:opacity-100"
                            onClick={() => handleAddSlot(dayIdx, hour)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Drag slots to move them, click empty cells to add new slots, 
            hover over slots to delete them
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
