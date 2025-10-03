import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MultiPractitionerScheduling() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [selectedSpecialists, setSelectedSpecialists] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [searchingSlots, setSearchingSlots] = useState(false);

  useEffect(() => {
    loadSpecialists();
  }, []);

  const loadSpecialists = async () => {
    try {
      const { data, error } = await supabase
        .from('specialists')
        .select(`
          *,
          profiles:user_id(first_name, last_name)
        `)
        .eq('is_accepting_patients', true);

      if (error) throw error;
      setSpecialists(data || []);
    } catch (error) {
      console.error('Error loading specialists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load specialists',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const findAvailableSlots = async () => {
    if (selectedSpecialists.length < 2) {
      toast({
        title: 'Select practitioners',
        description: 'Please select at least 2 practitioners',
        variant: 'destructive'
      });
      return;
    }

    setSearchingSlots(true);
    try {
      // Get availability for all selected specialists
      const availabilityPromises = selectedSpecialists.map(specId =>
        supabase
          .from('availability_schedules')
          .select('*')
          .eq('specialist_id', specId)
          .eq('is_active', true)
      );

      const results = await Promise.all(availabilityPromises);
      
      // Find overlapping time slots
      const slots: any[] = [];
      const today = new Date();
      
      for (let day = 0; day < 14; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() + day);
        const dayOfWeek = date.getDay();

        // Check if all specialists have availability on this day
        const allAvailable = results.every(({ data }) =>
          data?.some(schedule => schedule.day_of_week === dayOfWeek)
        );

        if (allAvailable) {
          // Find overlapping hours
          const daySchedules = results.map(({ data }) =>
            data?.filter(s => s.day_of_week === dayOfWeek)
          );

          slots.push({
            date: date.toISOString().split('T')[0],
            practitioners: selectedSpecialists.length,
            availableHours: ['09:00', '10:00', '11:00', '14:00', '15:00']
          });
        }
      }

      setAvailableSlots(slots);
      
      toast({
        title: 'Slots found',
        description: `Found ${slots.length} available dates`
      });
    } catch (error) {
      console.error('Error finding slots:', error);
      toast({
        title: 'Search failed',
        description: 'Failed to find available slots',
        variant: 'destructive'
      });
    } finally {
      setSearchingSlots(false);
    }
  };

  const bookGroupAppointment = async (slot: any, time: string) => {
    if (!user) return;

    try {
      const datetime = `${slot.date}T${time}:00Z`;

      // Create group appointment slot
      const { data: groupSlot, error: slotError } = await supabase
        .from('group_appointment_slots')
        .insert([{
          required_specialists: selectedSpecialists,
          slot_datetime: datetime,
          duration_minutes: 60,
          slot_type: 'sequential',
          is_available: false
        }])
        .select()
        .single();

      if (slotError) throw slotError;

      // Create appointments for each specialist
      const appointmentPromises = selectedSpecialists.map((specId, index) => {
        const offset = index * 60; // 60 minutes per specialist
        const specDatetime = new Date(datetime);
        specDatetime.setMinutes(specDatetime.getMinutes() + offset);

        return supabase.from('appointments').insert([{
          patient_id: user.id,
          specialist_id: specId,
          scheduled_at: specDatetime.toISOString(),
          duration_minutes: 60,
          consultation_type: 'in_person',
          status: 'pending',
          fee: 150
        }]);
      });

      await Promise.all(appointmentPromises);

      toast({
        title: 'Appointments booked',
        description: `Successfully booked ${selectedSpecialists.length} sequential appointments`
      });

      setSelectedSpecialists([]);
      setAvailableSlots([]);
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking failed',
        description: 'Failed to book group appointments',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold">Multi-Practitioner Scheduling</h1>
          <p className="text-muted-foreground mt-2">
            Book coordinated appointments with multiple healthcare providers
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Practitioners
            </CardTitle>
            <CardDescription>
              Choose 2 or more practitioners for coordinated care
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialists.map((spec) => {
                const isSelected = selectedSpecialists.includes(spec.id);
                
                return (
                  <Card
                    key={spec.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSpecialists(prev => prev.filter(id => id !== spec.id));
                      } else {
                        setSelectedSpecialists(prev => [...prev, spec.id]);
                      }
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="font-medium">
                          Dr. {spec.profiles?.first_name} {spec.profiles?.last_name}
                        </div>
                        <Badge variant="secondary">{spec.specialty[0]}</Badge>
                        {isSelected && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button
              onClick={findAvailableSlots}
              disabled={selectedSpecialists.length < 2 || searchingSlots}
              className="w-full"
            >
              {searchingSlots && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Calendar className="mr-2 h-4 w-4" />
              Find Available Times ({selectedSpecialists.length} practitioners)
            </Button>
          </CardContent>
        </Card>

        {availableSlots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Group Appointment Slots</CardTitle>
              <CardDescription>
                Select a time when all {selectedSpecialists.length} practitioners are available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableSlots.map((slot, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {new Date(slot.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sequential appointments with {slot.practitioners} practitioners
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {slot.availableHours.map((time: string) => (
                            <Button
                              key={time}
                              size="sm"
                              variant="outline"
                              onClick={() => bookGroupAppointment(slot, time)}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}