import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, FileText, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  patientId: string;
}

export function DocumentShareDialog({ 
  open, 
  onOpenChange, 
  documentId, 
  documentTitle,
  patientId 
}: DocumentShareDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recipientSpecialist, setRecipientSpecialist] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');
  const [consentGiven, setConsentGiven] = useState(false);
  const [specialists, setSpecialists] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchSpecialists();
    }
  }, [open]);

  const fetchSpecialists = async () => {
    const { data } = await supabase
      .from('specialists')
      .select(`
        id,
        profiles:user_id (
          first_name,
          last_name
        )
      `)
      .eq('verification_status', 'verified')
      .limit(50);
    
    if (data) setSpecialists(data);
  };

  const handleShare = async () => {
    if (!consentGiven) {
      toast({
        title: 'Consent Required',
        description: 'You must provide consent to share this document.',
        variant: 'destructive',
      });
      return;
    }

    if (!recipientSpecialist || !purpose) {
      toast({
        title: 'Missing Information',
        description: 'Please select a specialist and provide a purpose.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create document share record
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

      const { error: shareError } = await supabase
        .from('document_shares')
        .insert({
          document_id: documentId,
          shared_by: patientId,
          shared_with: recipientSpecialist,
          purpose,
          expires_at: expiryDate.toISOString(),
          consent_given: true,
          consent_given_at: new Date().toISOString()
        });

      if (shareError) throw shareError;

      // Log audit trail
      await supabase.from('audit_logs').insert({
        user_id: patientId,
        action: 'document_shared',
        resource_type: 'medical_record',
        resource_id: documentId,
        changes: {
          shared_with: recipientSpecialist,
          purpose,
          expires_at: expiryDate.toISOString()
        }
      });

      toast({
        title: 'Document Shared Successfully',
        description: `Access granted to the specialist until ${expiryDate.toLocaleDateString()}.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Share error:', error);
      toast({
        title: 'Error Sharing Document',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Share Medical Document
          </DialogTitle>
          <DialogDescription>
            Securely share "{documentTitle}" with another healthcare provider.
            Your consent is required for cross-border document exchange.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This document will be shared securely with end-to-end encryption. 
              All access is logged and auditable. You can revoke access at any time.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="specialist">Select Healthcare Provider</Label>
            <Select value={recipientSpecialist} onValueChange={setRecipientSpecialist}>
              <SelectTrigger id="specialist">
                <SelectValue placeholder="Choose a verified specialist" />
              </SelectTrigger>
              <SelectContent>
                {specialists.map((spec) => (
                  <SelectItem key={spec.id} value={spec.id}>
                    Dr. {spec.profiles?.first_name} {spec.profiles?.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Sharing</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="E.g., Second opinion, referral, continued care..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Access Duration
            </Label>
            <Select value={expiryDays} onValueChange={setExpiryDays}>
              <SelectTrigger id="expiry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days (recommended)</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Access will automatically expire after this period
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="consent" 
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="consent" className="cursor-pointer font-medium">
                  I consent to sharing this medical document
                </Label>
                <p className="text-xs text-muted-foreground">
                  I understand that this document contains sensitive health information and 
                  authorize its secure sharing with the selected healthcare provider for the 
                  stated purpose. This consent complies with GDPR/HIPAA cross-border data 
                  transfer regulations.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Privacy Notice:</strong> Your data is protected by international healthcare 
              data protection laws. The recipient specialist is bound by professional confidentiality 
              and data protection obligations in their jurisdiction.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={loading || !consentGiven}>
            {loading ? 'Sharing...' : 'Share Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}