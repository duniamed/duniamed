import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvailabilitySchedule {
  id: string;
  specialist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface UseAvailabilityOptions {
  specialistId: string;
  autoFetch?: boolean;
}

export function useAvailability({ specialistId, autoFetch = true }: UseAvailabilityOptions) {
  const [availability, setAvailability] = useState<AvailabilitySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAvailability = async () => {
    if (!specialistId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('availability_schedules')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('is_active', true)
        .order('day_of_week');

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to load availability schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSlot = async (slotId: string, updates: Partial<AvailabilitySchedule>) => {
    try {
      const { error } = await supabase
        .from('availability_schedules')
        .update(updates)
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Availability updated successfully',
      });

      await fetchAvailability();
    } catch (error) {
      console.error('Error updating slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to update availability',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const addSlot = async (slotData: Omit<AvailabilitySchedule, 'id'>) => {
    try {
      const { error } = await supabase
        .from('availability_schedules')
        .insert(slotData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'New availability slot created',
      });

      await fetchAvailability();
    } catch (error) {
      console.error('Error adding slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to add slot',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('availability_schedules')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Availability slot removed',
      });

      await fetchAvailability();
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete slot',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchAvailability();
    }
  }, [specialistId, autoFetch]);

  return {
    availability,
    loading,
    fetchAvailability,
    updateSlot,
    addSlot,
    deleteSlot,
  };
}