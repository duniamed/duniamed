import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export const AppointmentQuickBooking: React.FC = () => {
  const [specialty, setSpecialty] = useState('');
  const [urgency, setUrgency] = useState<'immediate' | 'scheduled'>('scheduled');
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: availableSpecialists } = useQuery({
    queryKey: ['available-specialists', specialty],
    queryFn: async () => {
      if (!specialty) return [];
      
      const { data } = await supabase
        .from('specialists')
        .select('*')
        .contains('specialty', [specialty])
        .eq('is_accepting_patients', true);
      
      return (data || []) as any[];
    },
    enabled: !!specialty
  });

  const bookImmediateMutation = useMutation({
    mutationFn: async (specialistId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          specialist_id: specialistId,
          consultation_type: 'video',
          scheduled_at: new Date().toISOString(),
          duration_minutes: 30,
          status: 'pending',
          modality: 'telehealth',
          urgency_level: 'urgent',
          fee: 0
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (appointment) => {
      toast({
        title: "Appointment Booked",
        description: "Connecting you with available specialist now",
      });
      navigate(`/consultation/${appointment.id}`);
    }
  });

  const specialties = [
    'General Practice',
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Pediatrics',
    'Psychiatry',
    'Orthopedics'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Quick Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Button
            variant={urgency === 'immediate' ? 'default' : 'outline'}
            onClick={() => setUrgency('immediate')}
            className="flex-1"
          >
            <Zap className="mr-2 h-4 w-4" />
            See Now
          </Button>
          <Button
            variant={urgency === 'scheduled' ? 'default' : 'outline'}
            onClick={() => setUrgency('scheduled')}
            className="flex-1"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </div>

        <div>
          <Label>Select Specialty</Label>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger>
              <SelectValue placeholder="Choose specialty" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map(spec => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {urgency === 'immediate' && specialty && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 animate-pulse text-primary" />
              <span className="text-sm font-medium">
                Finding available {specialty} specialists...
              </span>
            </div>

            {availableSpecialists
              ?.filter((spec: any) => spec.specialist_live_status?.is_live)
              .map((specialist: any) => (
                <div
                  key={specialist.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      Dr. {specialist.profiles?.first_name} {specialist.profiles?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {specialist.specialty.join(', ')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-green-600">Available Now</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => bookImmediateMutation.mutate(specialist.id)}
                    disabled={bookImmediateMutation.isPending}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                </div>
              ))}

            {availableSpecialists?.filter((spec: any) => spec.specialist_live_status?.is_live)
              .length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No specialists currently available</p>
                <p className="text-sm mt-2">Try scheduling an appointment instead</p>
              </div>
            )}
          </div>
        )}

        {urgency === 'scheduled' && (
          <Button className="w-full" onClick={() => navigate('/appointments/new')}>
            <Calendar className="mr-2 h-4 w-4" />
            Browse Available Times
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
