import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Flag, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

/**
 * C9 VISIBILITY - Review Flag History
 * Specialists can view all flags on their reviews with immutable audit trail
 */

function ReviewFlagHistoryContent() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlagHistory();
  }, []);

  const loadFlagHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get specialist ID
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) return;

      // Load all flags for this specialist's reviews
      const { data, error } = await supabase
        .from('review_flags')
        .select(`
          *,
          reviews!inner(
            id,
            rating,
            comment,
            created_at,
            profiles!reviews_patient_id_fkey(first_name, last_name)
          ),
          profiles!review_flags_flagged_by_fkey(first_name, last_name)
        `)
        .eq('reviews.specialist_id', specialist.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlags(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading flag history",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFlagStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending' },
      reviewed: { variant: 'default', label: 'Reviewed' },
      upheld: { variant: 'destructive', label: 'Upheld' },
      dismissed: { variant: 'default', label: 'Dismissed' }
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFlagTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      inappropriate: 'Inappropriate Content',
      spam: 'Spam',
      harassment: 'Harassment',
      false_info: 'False Information',
      other: 'Other'
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  return (
    <DashboardLayout
      title="Review Flag History"
      description="View all flags on your reviews with complete audit trail"
    >
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading flag history...
            </CardContent>
          </Card>
        ) : flags.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No flags on your reviews</p>
            </CardContent>
          </Card>
        ) : (
          flags.map((flag) => (
            <Card key={flag.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Flag className="h-5 w-5" />
                    Flag #{flag.id.slice(0, 8)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getFlagStatusBadge(flag.status)}
                    {getFlagTypeBadge(flag.flag_type)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Original Review:</p>
                  <p className="text-sm">{flag.reviews.comment}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {flag.reviews.profiles?.first_name} {flag.reviews.profiles?.last_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(flag.reviews.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Flag Reason:</p>
                  <p className="text-sm text-muted-foreground">{flag.flag_reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Flagged by:</span>{' '}
                    {flag.profiles?.first_name} {flag.profiles?.last_name}
                  </div>
                  <div>
                    <span className="font-medium">Flagged on:</span>{' '}
                    {format(new Date(flag.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                  {flag.reviewed_at && (
                    <>
                      <div>
                        <span className="font-medium">Reviewed on:</span>{' '}
                        {format(new Date(flag.reviewed_at), 'MMM d, yyyy h:mm a')}
                      </div>
                      {flag.moderator_notes && (
                        <div className="col-span-2">
                          <span className="font-medium">Moderator notes:</span>{' '}
                          {flag.moderator_notes}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ReviewFlagHistory() {
  return (
    <ProtectedRoute>
      <ReviewFlagHistoryContent />
    </ProtectedRoute>
  );
}
