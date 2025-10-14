import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Shield, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";

export default function BlockchainMedicalRecordsDashboard() {
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<any>(null);
  const { toast } = useToast();

  const handleVerifyRecord = async (recordHash: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('blockchain-verify-record', {
        body: {
          recordHash,
          blockchainNetwork: 'ethereum'
        }
      });

      if (error) throw error;

      setVerification(data.verification);
      toast({
        title: "Verification Complete",
        description: `Record ${data.verification.verified ? 'verified' : 'not found'}`,
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-bold">Blockchain Medical Records</h2>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Verify Record Integrity</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => handleVerifyRecord('0x123abc...')} 
              disabled={loading}
              className="flex-1"
            >
              Verify Latest Record
            </Button>
            <Button variant="outline" disabled={loading}>
              View Audit Trail
            </Button>
          </div>

          {verification && (
            <Card className="p-4 bg-muted">
              <div className="flex items-start gap-3">
                {verification.verified ? (
                  <CheckCircle className="h-6 w-6 text-success" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                )}
                <div className="flex-1">
                  <p className="font-semibold mb-2">
                    Status: <Badge>{verification.integrity_status}</Badge>
                  </p>
                  <div className="text-sm space-y-1">
                    <p>Block Number: {verification.block_number}</p>
                    <p>Timestamp: {verification.timestamp}</p>
                    <a 
                      href={`https://etherscan.io/tx/${verification.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      View on Blockchain <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Blockchain Transactions</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((_, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Medical Record #{idx + 1}</p>
                  <p className="text-sm text-muted-foreground">Hash: 0x{Math.random().toString(16).slice(2, 10)}...</p>
                </div>
              </div>
              <Badge variant="outline">Verified</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
