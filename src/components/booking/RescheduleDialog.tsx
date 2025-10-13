import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RescheduleDialogProps {
  appointmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRescheduled: () => void;
}

interface AlternativeSlot {
  date: string;
  time: string;
  score: number;
  available: boolean;
}

export function RescheduleDialog({ 
  appointmentId, 
  open, 
  onOpenChange, 
  onRescheduled 
}: RescheduleDialogProps) {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<AlternativeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AlternativeSlot | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAlternativeSlots();
    }
  }, [open, appointmentId]);

  const loadAlternativeSlots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('find-alternative-slots', {
        body: { appointmentId },
      });

      if (error) throw error;

      if (data?.slots) {
        setSlots(data.slots);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to Load Slots',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;

    setRescheduling(true);
    try {
      const { error } = await supabase.functions.invoke('one-tap-reschedule', {
        body: {
          appointmentId,
          newDate: selectedSlot.date,
          newTime: selectedSlot.time,
        },
      });

      if (error) throw error;

      toast({
        title: 'Appointment Rescheduled',
        description: `Your appointment has been moved to ${format(new Date(selectedSlot.date), 'MMMM d, yyyy')} at ${selectedSlot.time}`,
      });

      onRescheduled();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Reschedule Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Choose a New Time
          </DialogTitle>
          <DialogDescription>
            Select from available alternative slots
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {slots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No alternative slots available at this time.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={loadAlternativeSlots}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                {slots.map((slot, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedSlot === slot ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(slot.date), 'EEEE, MMMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{slot.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Badge variant="outline" className="bg-primary/10">
                              ⭐ Best Match
                            </Badge>
                          )}
                          {selectedSlot === slot && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleReschedule}
                    disabled={!selectedSlot || rescheduling}
                    className="flex-1"
                  >
                    {rescheduling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rescheduling...
                      </>
                    ) : (
                      'Confirm Reschedule'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={rescheduling}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}