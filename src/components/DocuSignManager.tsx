import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileSignature, Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Signature {
  id: string;
  document_type: string;
  document_id: string;
  docusign_envelope_id: string;
  signing_url: string;
  status: string;
  signed_at: string;
  created_at: string;
}

export default function DocuSignManager() {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    documentType: '',
    signerEmail: '',
    signerName: '',
    documentBase64: ''
  });

  useEffect(() => {
    fetchSignatures();
  }, []);

  const fetchSignatures = async () => {
    try {
      const { data, error } = await supabase
        .from('document_signatures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSignatures(data || []);
    } catch (error: any) {
      toast.error('Failed to load signatures');
    } finally {
      setLoading(false);
    }
  };

  const sendForSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('docusign-signature', {
        body: formData
      });

      if (error) throw error;

      toast.success('Document sent for signature!');
      
      if (data.signingUrl) {
        window.open(data.signingUrl, '_blank');
      }

      setFormData({
        documentType: '',
        signerEmail: '',
        signerName: '',
        documentBase64: ''
      });

      fetchSignatures();
    } catch (error: any) {
      toast.error('Failed to send document: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1];
        setFormData(prev => ({ ...prev, documentBase64: base64 || '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Signed</Badge>;
      case 'sent':
        return <Badge className="bg-blue-500"><Send className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'declined':
      case 'voided':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileSignature className="w-8 h-8" />
            E-Signature Management
          </h1>
          <p className="text-muted-foreground">DocuSign integration for legal documents</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Send for Signature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Document for Signature</DialogTitle>
            </DialogHeader>
            <form onSubmit={sendForSignature} className="space-y-4">
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Input
                  id="documentType"
                  value={formData.documentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                  placeholder="e.g., Consent Form"
                  required
                />
              </div>

              <div>
                <Label htmlFor="signerName">Signer Name</Label>
                <Input
                  id="signerName"
                  value={formData.signerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, signerName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="signerEmail">Signer Email</Label>
                <Input
                  id="signerEmail"
                  type="email"
                  value={formData.signerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, signerEmail: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="document">Upload Document (PDF)</Label>
                <Input
                  id="document"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  required
                />
              </div>

              <Button type="submit" disabled={sending} className="w-full">
                {sending ? 'Sending...' : 'Send for Signature'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {signatures.map((sig) => (
            <Card key={sig.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-semibold">{sig.document_type}</h3>
                  <p className="text-sm text-muted-foreground">
                    Envelope ID: {sig.docusign_envelope_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(sig.created_at).toLocaleString()}
                  </p>
                  {sig.signed_at && (
                    <p className="text-xs text-green-600">
                      Signed: {new Date(sig.signed_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(sig.status)}
                  {sig.signing_url && sig.status === 'sent' && (
                    <Button size="sm" onClick={() => window.open(sig.signing_url, '_blank')}>
                      Open Signing Link
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
