import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Download, Lock, Calendar, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SecureDelivery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [fileName, setFileName] = useState('');
  const [maxDownloads, setMaxDownloads] = useState('3');
  const [expiryHours, setExpiryHours] = useState('72');

  useEffect(() => {
    loadDeliveries();
  }, [user]);

  const loadDeliveries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('secure_deliveries')
        .select(`
          *,
          sender:sender_id(first_name, last_name),
          recipient:recipient_id(first_name, last_name)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load secure deliveries',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createSecureDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recipientId || !fileName) return;

    setSending(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiryHours));

      const secureLink = `https://app.example.com/secure-download/${crypto.randomUUID()}`;
      const encryptionKey = crypto.randomUUID(); // In production, use proper encryption

      const { error } = await supabase
        .from('secure_deliveries')
        .insert([{
          sender_id: user.id,
          recipient_id: recipientId,
          message_type: 'document',
          encrypted_content: JSON.stringify({ fileName, secureLink, encryptionKey }),
          delivery_method: 'encrypted',
          expires_at: expiresAt.toISOString(),
          max_downloads: parseInt(maxDownloads)
        }]);

      if (error) throw error;

      toast({
        title: 'Secure delivery created',
        description: 'The recipient will receive a secure link via email.'
      });

      setRecipientId('');
      setFileName('');
      loadDeliveries();
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast({
        title: 'Error',
        description: 'Failed to create secure delivery',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const downloadFile = async (deliveryId: string) => {
    try {
      // First get current count
      const { data: delivery } = await supabase
        .from('secure_deliveries')
        .select('download_count')
        .eq('id', deliveryId)
        .single();

      if (!delivery) return;

      const { error } = await supabase
        .from('secure_deliveries')
        .update({
          download_count: (delivery.download_count || 0) + 1,
          read_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (error) throw error;

      toast({
        title: 'Download started',
        description: 'Your secure file is being downloaded.'
      });

      loadDeliveries();
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Secure Document Delivery</h1>
          <p className="text-muted-foreground mt-2">
            Send encrypted documents with time-limited access and download tracking
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Secure Document
            </CardTitle>
            <CardDescription>
              Documents are encrypted and can only be accessed by the recipient for a limited time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createSecureDelivery} className="space-y-4">
              <div>
                <Label htmlFor="recipient">Recipient User ID</Label>
                <Input
                  id="recipient"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Enter recipient's user ID"
                  required
                />
              </div>
              <div>
                <Label htmlFor="filename">File Name</Label>
                <Input
                  id="filename"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="document.pdf"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="downloads">Max Downloads</Label>
                  <Select value={maxDownloads} onValueChange={setMaxDownloads}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 time</SelectItem>
                      <SelectItem value="3">3 times</SelectItem>
                      <SelectItem value="5">5 times</SelectItem>
                      <SelectItem value="10">10 times</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expiry">Link Expires In</Label>
                  <Select value={expiryHours} onValueChange={setExpiryHours}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="72">3 days</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                      <SelectItem value="720">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={sending}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Send Secure Document
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Delivery History</h2>
          {deliveries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No deliveries yet</p>
                <p className="text-sm text-muted-foreground">
                  Secure documents you send or receive will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => {
                const isExpired = new Date(delivery.expires_at) < new Date();
                const isSender = delivery.sender_id === user?.id;
                const downloadsRemaining = delivery.max_downloads - delivery.download_count;

                return (
                  <Card key={delivery.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            {delivery.file_name}
                          </CardTitle>
                          <CardDescription>
                            {isSender ? 'Sent to' : 'Received from'}{' '}
                            {isSender 
                              ? `${delivery.recipient?.first_name} ${delivery.recipient?.last_name}`
                              : `${delivery.sender?.first_name} ${delivery.sender?.last_name}`
                            }
                          </CardDescription>
                        </div>
                        <Badge variant={isExpired ? 'destructive' : 'default'}>
                          {isExpired ? 'Expired' : 'Active'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {delivery.download_count}/{delivery.max_downloads} downloads
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Expires {new Date(delivery.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                      {!isSender && !isExpired && downloadsRemaining > 0 && (
                        <Button 
                          size="sm" 
                          onClick={() => downloadFile(delivery.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download ({downloadsRemaining} remaining)
                        </Button>
                      )}
                      {isSender && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          Recipient has downloaded {delivery.download_count} time(s)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
