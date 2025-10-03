import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertCircle } from 'lucide-react';

/**
 * C15 PRIVACY - Consent Gate Component
 * Requires explicit consent before performing sensitive data operations
 */

interface ConsentGateProps {
  operation: string;
  purpose: string;
  dataTypes: string[];
  onConsent: () => void;
  onDeny: () => void;
  children: ReactNode;
}

export function ConsentGate({ operation, purpose, dataTypes, onConsent, onDeny, children }: ConsentGateProps) {
  const [open, setOpen] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkExistingConsent();
  }, [operation]);

  const checkExistingConsent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('consent_type', operation)
        .eq('granted', true)
        .is('revoked_at', null)
        .order('granted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setHasConsent(true);
        onConsent();
      }
    } catch (error) {
      console.error('Error checking consent:', error);
    }
  };

  const handleGrantConsent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('consent_records')
        .insert({
          user_id: user.id,
          consent_type: operation,
          consent_text: `I consent to ${purpose} for the following data types: ${dataTypes.join(', ')}`,
          version: '1.0',
          granted: true
        });

      if (error) throw error;

      // Log the consent as a data access event
      await (supabase as any)
        .from('data_access_logs')
        .insert({
          user_id: user.id,
          accessor_id: user.id,
          resource_type: 'consent',
          access_type: 'grant',
          purpose: purpose
        });

      setHasConsent(true);
      setOpen(false);
      onConsent();

      toast({
        title: "Consent Granted",
        description: "Your consent has been recorded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record consent",
        variant: "destructive",
      });
    }
  };

  const handleDeny = () => {
    setOpen(false);
    onDeny();
    toast({
      title: "Operation Cancelled",
      description: "Consent was not granted",
    });
  };

  if (hasConsent) {
    return <>{children}</>;
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Consent Required
            </DialogTitle>
            <DialogDescription>
              We need your explicit consent before proceeding
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Operation:</p>
              <p className="text-sm text-muted-foreground">{operation}</p>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Purpose:</p>
              <p className="text-sm text-muted-foreground">{purpose}</p>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Data Types Involved:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {dataTypes.map((type, idx) => (
                  <li key={idx} className="capitalize">{type.replace('_', ' ')}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-2 p-4 border border-amber-500 rounded-lg bg-amber-50 dark:bg-amber-950">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Your Rights
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  You can revoke this consent at any time from your Privacy Center. 
                  Revoking consent will not affect previously processed data but will 
                  prevent future operations of this type.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="understood"
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked as boolean)}
              />
              <label
                htmlFor="understood"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I understand and wish to proceed with this operation
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDeny}>
              Deny
            </Button>
            <Button onClick={handleGrantConsent} disabled={!understood}>
              Grant Consent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
