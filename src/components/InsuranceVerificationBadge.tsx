import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Flag } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface InsuranceVerificationBadgeProps {
  specialistId: string;
  payerId?: string;
  showFlagOption?: boolean;
}

export function InsuranceVerificationBadge({
  specialistId,
  payerId,
  showFlagOption = false,
}: InsuranceVerificationBadgeProps) {
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [flagReason, setFlagReason] = useState('');
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadVerification();
  }, [specialistId, payerId]);

  const loadVerification = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_verifications' as any)
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('is_active', true)
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading verification:', error);
      }
      
      if (data) {
        setVerification(data);
      }
    } catch (error: any) {
      console.error('Error loading verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagInsurance = async () => {
    if (!user || !flagReason.trim()) return;

    try {
      const { error } = await supabase
        .from('insurance_flags' as any)
        .insert({
          specialist_id: specialistId,
          flagged_by: user.id,
          payer_id: payerId || 'general',
          flag_reason: 'inaccurate_information',
          description: flagReason,
        });

      if (error) throw error;

      toast({
        title: 'Flag submitted',
        description: 'Thank you for helping keep our information accurate',
      });

      setFlagDialogOpen(false);
      setFlagReason('');
    } catch (error: any) {
      toast({
        title: 'Error submitting flag',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) return null;

  const isRecent = verification && 
    new Date(verification.verified_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const isExpired = verification?.expires_at && 
    new Date(verification.expires_at) < new Date();

  return (
    <div className="flex items-center gap-2">
      {verification ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge 
                variant={isExpired ? 'destructive' : isRecent ? 'default' : 'secondary'}
                className="flex items-center gap-1"
              >
                {isExpired ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <Shield className="h-3 w-3" />
                )}
                {isExpired ? 'Expired' : 'Verified'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Last verified: {new Date(verification.verified_at).toLocaleDateString()}
              </p>
              {verification.expires_at && (
                <p className="text-xs">
                  {isExpired ? 'Expired' : 'Expires'}: {new Date(verification.expires_at).toLocaleDateString()}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Not Verified
        </Badge>
      )}

      {showFlagOption && user && (
        <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Flag className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Insurance Information</DialogTitle>
              <DialogDescription>
                Help us keep insurance information accurate by reporting any discrepancies
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Describe the issue with this insurance information..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={4}
              />
              <Button 
                onClick={handleFlagInsurance}
                disabled={!flagReason.trim()}
                className="w-full"
              >
                Submit Flag
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
