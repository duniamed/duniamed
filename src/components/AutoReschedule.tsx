import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { format, addDays, addHours } from 'date-fns';

/**
 * C19 TELEHEALTH - Auto Reschedule Component
 * Automatically suggests and reschedules failed video consultations
 */

interface AutoRescheduleProps {
  appointmentId: string;
  originalDateTime: string;
  specialistId: string;
  reason: string;
  onRescheduled?: () => void;
}

interface SuggestedSlot {
  datetime: Date;
  available: boolean;
  reason?: string;
}

export function AutoReschedule({
  appointmentId,
  originalDateTime,
  specialistId,
  reason,
  onRescheduled
}: AutoRescheduleProps) {
  const [suggestedSlots, setSuggestedSlots] = useState<SuggestedSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useState(() => {
    generateSuggestions();
  });

  const generateSuggestions = () => {
    const original = new Date(originalDateTime);
    const suggestions: SuggestedSlot[] = [];

    // Suggest +1 hour (immediate retry)
    suggestions.push({
      datetime: addHours(original, 1),
      available: true,
      reason: 'Immediate retry'
    });

    // Suggest +4 hours (same day)
    suggestions.push({
      datetime: addHours(original, 4),
      available: true,
      reason: 'Later today'
    });

    // Suggest +1 day same time
    suggestions.push({
      datetime: addDays(original, 1),
      available: true,
      reason: 'Tomorrow at same time'
    });

    // Suggest +2 days
    suggestions.push({
      datetime: addDays(original, 2),
      available: true,
      reason: 'In 2 days'
    });

    setSuggestedSlots(suggestions);
    setSelectedSlot(suggestions[0].datetime); // Auto-select first option
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;

    setProcessing(true);

    try {
      // Update appointment
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          scheduled_at: selectedSlot.toISOString(),
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      // Log the reschedule event
      await supabase
        .from('audit_logs')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          resource_type: 'appointment',
          resource_id: appointmentId,
          action: 'reschedule_auto',
          changes: {
            reason: reason,
            original_time: originalDateTime,
            new_time: selectedSlot.toISOString(),
            auto_rescheduled: true
          }
        });

      // Send notification
      await supabase.functions.invoke('send-multi-channel-notification', {
        body: {
          user_id: (await supabase.auth.getUser()).data.user?.id,
          message: `Your appointment has been automatically rescheduled to ${format(selectedSlot, 'PPp')} due to: ${reason}`,
          priority: 'high',
          message_type: 'appointment_rescheduled'
        }
      });

      toast({
        title: "Appointment Rescheduled",
        description: `Your appointment is now scheduled for ${format(selectedSlot, 'PPp')}`,
      });

      if (onRescheduled) {
        onRescheduled();
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      toast({
        title: "Reschedule Failed",
        description: "Unable to reschedule appointment automatically",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Auto-Reschedule Appointment
        </CardTitle>
        <CardDescription>
          We'll automatically reschedule your appointment due to technical issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Reschedule Reason
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              {reason}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Select New Time:</Label>
          <RadioGroup
            value={selectedSlot?.toISOString()}
            onValueChange={(value) => setSelectedSlot(new Date(value))}
          >
            {suggestedSlots.map((slot, idx) => (
              <div key={idx} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted">
                <RadioGroupItem value={slot.datetime.toISOString()} id={`slot-${idx}`} />
                <Label htmlFor={`slot-${idx}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {format(slot.datetime, 'EEEE, MMMM d')}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(slot.datetime, 'h:mm a')}
                      </p>
                    </div>
                    <Badge variant="outline">{slot.reason}</Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleReschedule}
            disabled={!selectedSlot || processing}
            className="flex-1"
          >
            {processing ? 'Rescheduling...' : 'Confirm Reschedule'}
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          You'll receive a confirmation notification once the appointment is rescheduled
        </p>
      </CardContent>
    </Card>
  );
}
