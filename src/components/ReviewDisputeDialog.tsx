import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

/**
 * C12 MEDIATION - Review Dispute Dialog
 * Allows specialists to dispute reviews with evidence
 */

interface ReviewDisputeDialogProps {
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewDisputeDialog({ reviewId, open, onOpenChange }: ReviewDisputeDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a reason for the dispute",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.from('review_disputes').insert({
        review_id: reviewId,
        filed_by: user.id,
        dispute_reason: reason.trim()
      }).select().single();

      if (error) throw error;

      toast({
        title: "Dispute filed",
        description: `Case number: ${data.case_number}. A mediator will review your dispute within 48 hours.`
      });

      setReason('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error filing dispute",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Dispute Review
          </DialogTitle>
          <DialogDescription>
            File a dispute if you believe this review is inaccurate or violates guidelines
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dispute Reason</label>
            <Textarea
              placeholder="Explain why you're disputing this review..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              The review will be quarantined during mediation. Provide detailed evidence to support your claim.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Filing...' : 'File Dispute'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}