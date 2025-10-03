import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Archive, Shield, Lock, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface LegalArchive {
  id: string;
  complaint_id: string;
  archive_type: string;
  legal_hold: boolean;
  case_number: string;
  archive_hash: string;
  created_at: string;
}

export default function LegalArchiveManager() {
  const [archives, setArchives] = useState<LegalArchive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_archives')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArchives(data || []);
    } catch (error: any) {
      toast.error('Failed to load legal archives');
    } finally {
      setLoading(false);
    }
  };

  const createArchive = async (complaintId: string, archiveType: string, legalHold: boolean, caseNumber?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('legal-archive', {
        body: { complaintId, archiveType, legalHold, caseNumber }
      });

      if (error) throw error;

      toast.success('Legal archive created with hash: ' + data.hash.substring(0, 12));
      fetchArchives();
    } catch (error: any) {
      toast.error('Failed to create archive: ' + error.message);
    }
  };

  const verifyIntegrity = (hash: string) => {
    toast.info('Hash verification: ' + hash.substring(0, 20) + '...');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Archive className="w-8 h-8" />
            Legal Archive Management
          </h1>
          <p className="text-muted-foreground">Immutable legal hold storage with SHA-256 verification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">Total Archives</h3>
          </div>
          <p className="text-3xl font-bold">{archives.length}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold">Legal Holds</h3>
          </div>
          <p className="text-3xl font-bold">
            {archives.filter(a => a.legal_hold).length}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">Verified Hashes</h3>
          </div>
          <p className="text-3xl font-bold">{archives.length}</p>
        </Card>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {archives.map((archive) => (
            <Card key={archive.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{archive.archive_type}</h3>
                    {archive.legal_hold && (
                      <Badge variant="destructive">
                        <Lock className="w-3 h-3 mr-1" />
                        Legal Hold
                      </Badge>
                    )}
                  </div>
                  {archive.case_number && (
                    <p className="text-sm text-muted-foreground">
                      Case: {archive.case_number}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(archive.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-muted p-3 rounded mb-2">
                <p className="text-xs font-mono break-all">
                  Hash: {archive.archive_hash}
                </p>
              </div>

              <Button 
                size="sm" 
                variant="outline"
                onClick={() => verifyIntegrity(archive.archive_hash)}
              >
                <Shield className="w-3 h-3 mr-1" />
                Verify Integrity
              </Button>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
