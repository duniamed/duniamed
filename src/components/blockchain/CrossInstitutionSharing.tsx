import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Shield, Clock } from 'lucide-react';

export default function CrossInstitutionSharing() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recordHash, setRecordHash] = useState('');
  const [targetInstitution, setTargetInstitution] = useState('');
  const [consent, setConsent] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const handleShare = async () => {
    if (!consent) {
      toast({
        title: "Consent Required",
        description: "Patient consent is required for sharing",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('blockchain-cross-institution-share', {
        body: {
          record_hash: recordHash,
          target_institution: targetInstitution,
          patient_consent: consent
        }
      });

      if (error) throw error;

      setShareToken(data.sharing_data.share_token);
      toast({
        title: "Record Shared Successfully",
        description: `Shared with ${targetInstitution}`,
      });
    } catch (error: any) {
      toast({
        title: "Sharing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Share2 className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Cross-Institution Sharing</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Record Hash</label>
            <Input
              value={recordHash}
              onChange={(e) => setRecordHash(e.target.value)}
              placeholder="Enter blockchain record hash"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Target Institution</label>
            <Input
              value={targetInstitution}
              onChange={(e) => setTargetInstitution(e.target.value)}
              placeholder="Enter institution name"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked as boolean)}
            />
            <label className="text-sm">
              Patient has provided informed consent for sharing
            </label>
          </div>

          <Button onClick={handleShare} disabled={loading || !recordHash || !targetInstitution}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Record
          </Button>
        </div>
      </Card>

      {shareToken && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              <h4 className="font-medium">Sharing Successful</h4>
            </div>

            <div>
              <label className="text-sm font-medium">Access Token</label>
              <div className="mt-2 p-3 bg-secondary rounded font-mono text-sm break-all">
                {shareToken}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Token expires in 24 hours</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Share this token securely with {targetInstitution} to grant access to the record.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
