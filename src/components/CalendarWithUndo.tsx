import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Undo2, Calendar, Clock, XCircle, AlertCircle } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

/**
 * C18 CALENDARS - Calendar with Undo Support
 * Specialists manage availability with drag-drop, undo, and clear messaging
 */

interface BlockedSlot {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  blocking_message: string | null;
}

interface AvailabilityChange {
  id: string;
  change_type: string;
  old_value: any;
  new_value: any;
  can_undo: boolean;
  undone_at: string | null;
  created_at: string;
}

export function CalendarWithUndo({ specialistId }: { specialistId: string }) {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [recentChanges, setRecentChanges] = useState<AvailabilityChange[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockMessage, setBlockMessage] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCalendarData();
  }, [specialistId]);

  const fetchCalendarData = async () => {
    try {
      // Fetch blocked slots
      const { data: slots } = await supabase
        .from('blocked_time_slots')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      // Fetch recent changes
      const { data: changes } = await supabase
        .from('availability_changes_log')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('can_undo', true)
        .is('undone_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      setBlockedSlots(slots || []);
      setRecentChanges(changes || []);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  };

  const handleBlockTime = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${blockStart}`);
      const endTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${blockEnd}`);

      // Insert blocked slot
      const { data: newSlot, error: blockError } = await supabase
        .from('blocked_time_slots')
        .insert({
          specialist_id: specialistId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          reason: blockReason,
          blocking_message: blockMessage || 'No available appointments during this time'
        })
        .select()
        .single();

      if (blockError) throw blockError;

      // Log the change for undo
      await supabase
        .from('availability_changes_log')
        .insert({
          specialist_id: specialistId,
          change_type: 'block_time',
          new_value: newSlot,
          changed_by: user.id,
          can_undo: true
        });

      toast({
        title: "Time Blocked",
        description: "The time slot has been blocked successfully",
      });

      // Reset form
      setBlockStart('');
      setBlockEnd('');
      setBlockReason('');
      setBlockMessage('');
      setShowBlockForm(false);

      fetchCalendarData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block time slot",
        variant: "destructive",
      });
    }
  };

  const handleUnblockTime = async (slotId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const slot = blockedSlots.find(s => s.id === slotId);

      // Delete blocked slot
      const { error: deleteError } = await supabase
        .from('blocked_time_slots')
        .delete()
        .eq('id', slotId);

      if (deleteError) throw deleteError;

      // Log the change for undo
      await supabase
        .from('availability_changes_log')
        .insert({
          specialist_id: specialistId,
          change_type: 'unblock_time',
          old_value: slot,
          changed_by: user.id,
          can_undo: true
        });

      toast({
        title: "Time Unblocked",
        description: "The time slot is now available for booking",
      });

      fetchCalendarData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock time slot",
        variant: "destructive",
      });
    }
  };

  const handleUndo = async (changeId: string) => {
    try {
      const change = recentChanges.find(c => c.id === changeId);
      if (!change) return;

      if (change.change_type === 'block_time') {
        // Undo block: remove the blocked slot
        await supabase
          .from('blocked_time_slots')
          .delete()
          .eq('id', change.new_value.id);
      } else if (change.change_type === 'unblock_time') {
        // Undo unblock: restore the blocked slot
        await supabase
          .from('blocked_time_slots')
          .insert(change.old_value);
      }

      // Mark change as undone
      await supabase
        .from('availability_changes_log')
        .update({ undone_at: new Date().toISOString() })
        .eq('id', changeId);

      toast({
        title: "Change Undone",
        description: "The previous action has been reversed",
      });

      fetchCalendarData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to undo change",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Undo Panel */}
      {recentChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Undo2 className="h-5 w-5" />
              Recent Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentChanges.map((change) => (
                <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium capitalize">
                      {change.change_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(change.created_at), 'PPp')}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUndo(change.id)}
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Undo
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blocked Slots */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Blocked Time Slots
            </CardTitle>
            <Button onClick={() => setShowBlockForm(!showBlockForm)}>
              {showBlockForm ? 'Cancel' : 'Block Time'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Block Form */}
          {showBlockForm && (
            <div className="p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="block-start">Start Time</Label>
                  <Input
                    id="block-start"
                    type="time"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-end">End Time</Label>
                  <Input
                    id="block-end"
                    type="time"
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-reason">Reason (Internal)</Label>
                <Input
                  id="block-reason"
                  placeholder="e.g., Lunch break, Meeting"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-message">Patient-Facing Message</Label>
                <Textarea
                  id="block-message"
                  placeholder="Message shown to patients (optional)"
                  value={blockMessage}
                  onChange={(e) => setBlockMessage(e.target.value)}
                />
              </div>
              <Button onClick={handleBlockTime} className="w-full">
                Confirm Block
              </Button>
            </div>
          )}

          {/* Blocked Slots List */}
          <div className="space-y-2">
            {blockedSlots.length > 0 ? (
              blockedSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        {format(new Date(slot.start_time), 'PPp')} - {format(new Date(slot.end_time), 'p')}
                      </p>
                    </div>
                    {slot.reason && (
                      <p className="text-xs text-muted-foreground">{slot.reason}</p>
                    )}
                    {slot.blocking_message && (
                      <div className="flex items-start gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5" />
                        <p className="text-xs text-amber-600">{slot.blocking_message}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnblockTime(slot.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No blocked time slots
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
