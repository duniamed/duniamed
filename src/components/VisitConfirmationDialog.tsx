import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface VisitConfirmationDialogProps {
  appointmentId: string;
  userType: 'patient' | 'specialist';
  onClose: () => void;
  onConfirmed: () => void;
}

export function VisitConfirmationDialog({ appointmentId, userType, onClose, onConfirmed }: VisitConfirmationDialogProps) {
  const { toast } = useToast();
  const [signature, setSignature] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!signature.trim()) {
      toast({
        title: "Signature required",
        description: "Please enter your full name to confirm",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Check if confirmation record exists
      const { data: existing } = await supabase
        .from('visit_confirmations')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      const updateData = userType === 'patient' 
        ? {
            patient_confirmed: true,
            patient_confirmed_at: new Date().toISOString(),
            patient_signature: signature
          }
        : {
            specialist_confirmed: true,
            specialist_confirmed_at: new Date().toISOString(),
            specialist_signature: signature
          };

      if (existing) {
        await supabase
          .from('visit_confirmations')
          .update(updateData)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('visit_confirmations')
          .insert({
            appointment_id: appointmentId,
            ...updateData
          });
      }

      // Update appointment status
      await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      toast({
        title: "Visit confirmed",
        description: "Thank you for confirming the visit completion"
      });

      onConfirmed();
      onClose();
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

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for the dispute",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('visit_confirmations')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      const disputeData = {
        dispute_opened: true,
        dispute_reason: disputeReason,
        dispute_opened_at: new Date().toISOString(),
        resolution_status: 'pending' as const
      };

      if (existing) {
        await supabase
          .from('visit_confirmations')
          .update(disputeData)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('visit_confirmations')
          .insert({
            appointment_id: appointmentId,
            ...disputeData
          });
      }

      toast({
        title: "Dispute opened",
        description: "Your dispute has been submitted for review"
      });

      onClose();
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {!showDispute ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Confirm Visit Completion
              </DialogTitle>
              <DialogDescription>
                By confirming, you verify that the scheduled visit took place as planned.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="signature">Digital Signature (Full Name)</Label>
                <Textarea
                  id="signature"
                  placeholder="Enter your full name"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  This serves as your electronic signature confirming visit completion.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2">
              <Button onClick={handleConfirm} disabled={loading} className="w-full">
                {loading ? 'Confirming...' : 'Confirm Visit'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDispute(true)}
                className="w-full"
              >
                Service Not Delivered
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Report Service Issue
              </DialogTitle>
              <DialogDescription>
                Please describe what happened and why the service was not delivered as scheduled.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dispute">Dispute Reason</Label>
                <Textarea
                  id="dispute"
                  placeholder="Explain the issue in detail..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>

            <DialogFooter className="flex-col gap-2">
              <Button onClick={handleDispute} disabled={loading} variant="destructive" className="w-full">
                {loading ? 'Submitting...' : 'Submit Dispute'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDispute(false)}
                className="w-full"
              >
                Back to Confirmation
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
