import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropCalendar } from '@/components/DragDropCalendar';
import { CalendarWithUndo } from '@/components/CalendarWithUndo';

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SpecialistAvailability() {
  return (
    <ProtectedRoute>
      <AvailabilityContent />
    </ProtectedRoute>
  );
}

function AvailabilityContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

  useEffect(() => {
    fetchSpecialistData();
  }, [user]);

  const fetchSpecialistData = async () => {
    if (!user) return;

    const { data: specialistData } = await supabase
      .from('specialists')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (specialistData) {
      setSpecialistId(specialistData.id);
      fetchAvailability(specialistData.id);
    }
  };

  const fetchAvailability = async (specId: string) => {
    const { data, error } = await supabase
      .from('availability_schedules')
      .select('*')
      .eq('specialist_id', specId)
      .order('day_of_week');

    if (!error && data) {
      setAvailability(data);
    }
    
    setLoading(false);
  };

  const handleToggleDay = async (dayOfWeek: number, isActive: boolean) => {
    if (!specialistId) return;

    const existingSlot = availability.find(slot => slot.day_of_week === dayOfWeek);

    if (existingSlot) {
      const { error } = await supabase
        .from('availability_schedules')
        .update({ is_active: isActive })
        .eq('id', existingSlot.id);

      if (!error) {
        setAvailability(prev =>
          prev.map(slot =>
            slot.day_of_week === dayOfWeek ? { ...slot, is_active: isActive } : slot
          )
        );
        toast({
          title: 'Updated',
          description: `${DAYS[dayOfWeek]} availability updated`,
        });
      }
    } else if (isActive) {
      const { data, error } = await supabase
        .from('availability_schedules')
        .insert({
          specialist_id: specialistId,
          day_of_week: dayOfWeek,
          start_time: '09:00',
          end_time: '17:00',
          is_active: true,
        })
        .select()
        .single();

      if (!error && data) {
        setAvailability(prev => [...prev, data]);
        toast({
          title: 'Added',
          description: `${DAYS[dayOfWeek]} availability added`,
        });
      }
    }
  };

  const handleTimeChange = async (
    dayOfWeek: number,
    field: 'start_time' | 'end_time',
    value: string
  ) => {
    if (!specialistId) return;

    const slot = availability.find(s => s.day_of_week === dayOfWeek);
    if (!slot || !slot.id) return;

    const { error } = await supabase
      .from('availability_schedules')
      .update({ [field]: value })
      .eq('id', slot.id);

    if (!error) {
      setAvailability(prev =>
        prev.map(s =>
          s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s
        )
      );
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
    <DashboardLayout title="Manage Availability" description="Set your weekly availability for patient consultations">
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Availability Management</CardTitle>
          <CardDescription>
            Manage your schedule with simple toggles or advanced drag-and-drop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="simple" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="simple">Simple View</TabsTrigger>
              <TabsTrigger value="advanced">Drag & Drop</TabsTrigger>
              <TabsTrigger value="blocked">Blocked Times</TabsTrigger>
            </TabsList>

            <TabsContent value="simple">
              <div className="space-y-6">
                  {DAYS.map((day, index) => {
                    const slot = availability.find(s => s.day_of_week === index);
                    const isActive = slot?.is_active || false;

                    return (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex items-center gap-2 w-40">
                          <Switch
                            checked={isActive}
                            onCheckedChange={(checked) => handleToggleDay(index, checked)}
                          />
                          <Label className="font-medium">{day}</Label>
                        </div>
                        
                        {isActive && slot && (
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-2">
                              <Label>From:</Label>
                              <Input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                                className="w-32"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label>To:</Label>
                              <Input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                                className="w-32"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
            </TabsContent>

            <TabsContent value="advanced">
              {specialistId && <DragDropCalendar specialistId={specialistId} />}
            </TabsContent>

            <TabsContent value="blocked">
              {specialistId && <CalendarWithUndo specialistId={specialistId} />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </DashboardLayout>
    );
  }
