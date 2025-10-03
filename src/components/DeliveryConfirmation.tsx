import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * C14 DELIVERY - Delivery Confirmation
 * Allows patients to confirm or report non-receipt of critical messages
 */

interface DeliveryConfirmationProps {
  messageDeliveryId: string;
  messageType: string;
}

export function DeliveryConfirmation({ messageDeliveryId, messageType }: DeliveryConfirmationProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirmation = async (type: 'received' | 'not_received') => {
    if (type === 'not_received' && !notes.trim()) {
      setShowNotes(true);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('delivery_confirmations').insert({
        message_delivery_id: messageDeliveryId,
        confirmation_type: type,
        confirmed_by: user.id,
        notes: notes.trim() || null
      });

      if (error) throw error;

      if (type === 'not_received') {
        // Escalate for resend
        await supabase
          .from('message_deliveries')
          .update({ escalated: true, escalated_at: new Date().toISOString() })
          .eq('id', messageDeliveryId);
      }

      toast({
        title: type === 'received' ? "Confirmed" : "Reported",
        description: type === 'received' 
          ? "Thank you for confirming receipt"
          : "We'll resend this message through alternate channels"
      });

      setShowNotes(false);
      setNotes('');
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
    <div className="space-y-3 p-4 border rounded-lg bg-card">
      <p className="text-sm font-medium">Did you receive this {messageType}?</p>
      
      {!showNotes ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleConfirmation('received')}
            disabled={loading}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Yes, Received
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNotes(true)}
            disabled={loading}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            No, Not Received
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            placeholder="Please describe the issue (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleConfirmation('not_received')}
              disabled={loading}
            >
              Report Non-Receipt
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowNotes(false);
                setNotes('');
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}