import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

/**
 * C7 SUPPORT - Supervisor Escalation
 * 
 * WORKFLOW:
 * 1. Specialist/Patient can escalate ticket to supervisor
 * 2. Reason required for escalation
 * 3. SLA timer resets for escalated tickets
 * 4. Priority automatically increased
 * 5. Supervisor notified immediately
 */

interface SupportEscalationProps {
  ticketId: string;
  onClose?: () => void;
  onEscalated?: () => void;
}

export function SupportEscalation({ ticketId, onClose, onEscalated }: SupportEscalationProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleEscalate = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for escalation",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          priority: 'urgent',
          escalated: true,
          escalation_reason: reason,
          escalated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      // Notify supervisor
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'support_escalation',
          ticket_id: ticketId,
          reason
        }
      });

      toast({
        title: "Ticket escalated",
        description: "A supervisor will review your case immediately"
      });

      onEscalated?.();
      setIsOpen(false);
      onClose?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Escalate to Supervisor
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) onClose?.();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Escalate to Supervisor
            </DialogTitle>
            <DialogDescription>
              Your ticket will be prioritized and reviewed by a supervisor immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Escalation Reason</Label>
              <Textarea
                id="reason"
                placeholder="Why does this need supervisor attention?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEscalate} disabled={loading}>
              {loading ? 'Escalating...' : 'Escalate Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
