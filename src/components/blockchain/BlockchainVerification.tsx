import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlockchainVerificationProps {
  recordId: string;
  recordType: string;
  patientId: string;
}

export function BlockchainVerification({ recordId, recordType, patientId }: BlockchainVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<any>(null);
  const { toast } = useToast();

  const verifyRecord = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('blockchain-verify-record', {
        body: { recordId, recordType, patientId }
      });

      if (error) throw error;

      setVerification(data.verification);
      toast({
        title: 'Verification Complete',
        description: data.verification.verified ? 'Record integrity verified' : 'Verification issues detected',
      });
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Blockchain Verification
        </CardTitle>
        <CardDescription>Cryptographic integrity verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={verifyRecord} disabled={loading} className="w-full">
          {loading ? 'Verifying...' : 'Verify Record Integrity'}
        </Button>

        {verification && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Verification Status</span>
              <Badge variant={verification.verified ? 'default' : 'destructive'}>
                {verification.verified ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-1" />
                )}
                {verification.verified ? 'Verified' : 'Failed'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Integrity Score</span>
                <span className="font-medium">{verification.integrity_score}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-medium">{(verification.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Blockchain Hash</span>
                <span className="font-mono text-xs">{verification.blockchain_hash?.slice(0, 16)}...</span>
              </div>
            </div>

            {verification.tamper_detected && (
              <div className="bg-destructive/10 p-3 rounded-md">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Tampering Detected</span>
                </div>
              </div>
            )}

            {verification.audit_trail && verification.audit_trail.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Audit Trail</h4>
                <div className="space-y-1">
                  {verification.audit_trail.map((entry: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{entry}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
