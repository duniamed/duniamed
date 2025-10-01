import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Send, DollarSign } from 'lucide-react';

interface Claim {
  id: string;
  claim_number: string;
  payer_name: string;
  service_date: string;
  billed_amount: number;
  status: string;
  submission_date: string | null;
}

export default function ClaimsManagement() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) return;

      const { data, error } = await supabase
        .from('insurance_claims')
        .select('*')
        .eq('specialist_id', specialist.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading claims',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const submitClaim = async (claimId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('submit-claim', {
        body: { claimId }
      });

      if (error) throw error;

      toast({
        title: 'Claim submitted',
        description: 'Your claim has been submitted successfully',
      });

      loadClaims();
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'submitted': return 'secondary';
      case 'denied': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading claims...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Claims Management</h1>
          </div>
          <p className="text-muted-foreground">
            Submit and track insurance claims
          </p>
        </div>

        <div className="grid gap-4">
          {claims.map((claim) => (
            <Card key={claim.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{claim.claim_number}</CardTitle>
                    <CardDescription>
                      {claim.payer_name} • Service: {new Date(claim.service_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(claim.status)}>
                    {claim.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">${claim.billed_amount.toFixed(2)}</span>
                </div>

                {claim.status === 'draft' && (
                  <Button onClick={() => submitClaim(claim.id)} size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Claim
                  </Button>
                )}

                {claim.submission_date && (
                  <p className="text-sm text-muted-foreground">
                    Submitted: {new Date(claim.submission_date).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {claims.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No claims found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}