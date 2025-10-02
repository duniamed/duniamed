import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DocumentShareDialog } from '@/components/documents/DocumentShareDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, Eye, XCircle } from 'lucide-react';

export default function DocumentSharing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShares();
  }, [user]);

  const loadShares = async () => {
    try {
      const { data, error } = await supabase
        .from('document_shares')
        .select('*, medical_records(title)')
        .eq('shared_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShares(data || []);
    } catch (error) {
      console.error('Error loading shares:', error);
      toast({
        title: 'Error',
        description: 'Failed to load document shares',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('document_shares')
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: user?.id,
        })
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: 'Access Revoked',
        description: 'Document access has been revoked',
      });

      loadShares();
    } catch (error) {
      console.error('Error revoking share:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke access',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Share2 className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Document Sharing</h1>
              <p className="text-muted-foreground">Manage shared access to your medical records</p>
            </div>
          </div>
        </div>

        {shares.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No active document shares
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {shares.map((share) => (
              <Card key={share.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {(share.medical_records as any)?.title || 'Document'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Purpose: {share.purpose}
                      </p>
                    </div>
                    {share.revoked_at ? (
                      <Badge variant="destructive">Revoked</Badge>
                    ) : new Date(share.expires_at) < new Date() ? (
                      <Badge variant="secondary">Expired</Badge>
                    ) : (
                      <Badge>Active</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Shared on</p>
                        <p>{new Date(share.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p>{new Date(share.expires_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Access Count</p>
                        <p className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {share.access_count}
                        </p>
                      </div>
                      {share.last_accessed_at && (
                        <div>
                          <p className="text-muted-foreground">Last Accessed</p>
                          <p>{new Date(share.last_accessed_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    
                    {!share.revoked_at && new Date(share.expires_at) > new Date() && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevoke(share.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Revoke Access
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
