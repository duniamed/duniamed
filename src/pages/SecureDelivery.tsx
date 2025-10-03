import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Download, ExternalLink, Shield, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface SecureDelivery {
  id: string;
  sender_id: string;
  recipient_id: string;
  delivery_type: string;
  file_url: string;
  secure_link: string;
  link_expires_at: string;
  delivered_at: string | null;
  download_count: number;
  max_downloads: number;
  created_at: string;
}

export default function SecureDelivery() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<SecureDelivery[]>([]);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('secure_deliveries')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      toast({
        title: "Error",
        description: "Failed to load secure deliveries.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (deliveryId: string, secureLink: string) => {
    try {
      // Update download count
      const delivery = deliveries.find(d => d.id === deliveryId);
      if (!delivery) return;
      
      const { error } = await supabase
        .from('secure_deliveries')
        .update({ 
          download_count: delivery.download_count + 1,
          delivered_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (error) throw error;

      // Open secure link
      window.open(secureLink, '_blank');
      
      toast({
        title: "Download Started",
        description: "Your secure document download has begun.",
      });

      loadDeliveries();
    } catch (error) {
      console.error('Error downloading:', error);
      toast({
        title: "Error",
        description: "Failed to download document.",
        variant: "destructive",
      });
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const canDownload = (delivery: SecureDelivery) => {
    return !isExpired(delivery.link_expires_at) && 
           delivery.download_count < delivery.max_downloads;
  };

  const getDeliveryTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      medical_record: 'bg-blue-500',
      lab_result: 'bg-purple-500',
      prescription: 'bg-green-500',
      document: 'bg-orange-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Lock className="h-8 w-8 text-primary" />
            Secure Document Delivery
            <InfoTooltip content="View and download encrypted medical documents with secure, time-limited links. All deliveries are tracked with download limits and expiration dates for your security." />
          </h1>
          <p className="text-muted-foreground mt-2">
            Access your securely delivered medical documents and records
          </p>
        </div>

        {/* Security Notice */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">End-to-End Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  All documents are encrypted in transit and at rest. Secure links expire after the time limit
                  and have download restrictions to protect your sensitive health information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deliveries List */}
        <div className="space-y-4">
          {deliveries.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No secure deliveries yet
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            deliveries.map((delivery) => {
              const expired = isExpired(delivery.link_expires_at);
              const downloadable = canDownload(delivery);
              const expiresIn = Math.ceil(
                (new Date(delivery.link_expires_at).getTime() - Date.now()) / (1000 * 60 * 60)
              );

              return (
                <Card key={delivery.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {delivery.delivery_type.replace('_', ' ')}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Delivered: {new Date(delivery.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={getDeliveryTypeColor(delivery.delivery_type)}>
                        {delivery.delivery_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2">
                        {expired ? (
                          <Badge variant="destructive">
                            <Clock className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Expires in {expiresIn}h
                          </Badge>
                        )}
                        
                        <Badge variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          {delivery.download_count} / {delivery.max_downloads} downloads
                        </Badge>

                        {delivery.delivered_at && (
                          <Badge variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            Downloaded
                          </Badge>
                        )}
                      </div>

                      {/* Download Button */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDownload(delivery.id, delivery.secure_link)}
                          disabled={!downloadable}
                          className="flex-1"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {expired ? 'Link Expired' : 
                           delivery.download_count >= delivery.max_downloads ? 'Download Limit Reached' :
                           'Download Securely'}
                        </Button>
                        {downloadable && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(delivery.secure_link, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Security Info */}
                      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                        <p className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          End-to-end encrypted delivery
                        </p>
                        <p className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Secure link with automatic expiration
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
