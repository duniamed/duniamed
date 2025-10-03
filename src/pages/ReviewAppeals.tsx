import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertCircle, MessageSquare, CheckCircle, XCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  rating: number;
  comment: string;
  moderation_status: string;
  moderation_reason: string | null;
  appeal_status: string;
  flag_reason: string | null;
  created_at: string;
}

function ReviewAppealsContent() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [appealText, setAppealText] = useState('');
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFlaggedReviews();
  }, []);

  const loadFlaggedReviews = async () => {
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
        .from('reviews')
        .select('*')
        .eq('specialist_id', specialist.id)
        .in('moderation_status', ['flagged', 'censored'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews((data || []) as any);
    } catch (error: any) {
      toast({
        title: 'Error loading reviews',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!appealText.trim() || !selectedReview) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          appeal_status: 'pending',
          appeal_text: appealText,
          appeal_submitted_at: new Date().toISOString()
        })
        .eq('id', selectedReview);

      if (error) throw error;

      toast({
        title: 'Appeal submitted',
        description: 'Your appeal will be reviewed within 48 hours',
      });

      setAppealText('');
      setSelectedReview(null);
      loadFlaggedReviews();
    } catch (error: any) {
      toast({
        title: 'Error submitting appeal',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container-modern py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              Review Appeals
            </h1>
            <p className="text-muted-foreground mt-2">
              Appeal flagged or censored reviews
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading reviews...
              </CardContent>
            </Card>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">No Flagged Reviews</h3>
                <p className="text-muted-foreground">
                  You don't have any reviews requiring attention
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {renderStars(review.rating)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Badge variant={review.moderation_status === 'flagged' ? 'destructive' : 'secondary'}>
                            {review.moderation_status}
                          </Badge>
                          {review.appeal_status && review.appeal_status !== 'none' && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(review.appeal_status)}
                                <span className="text-sm">Appeal: {review.appeal_status}</span>
                              </div>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        </CardDescription>
                      </div>

                      {(!review.appeal_status || review.appeal_status === 'none') && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReview(review.id)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Appeal
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Appeal Review Moderation</DialogTitle>
                              <DialogDescription>
                                Explain why you believe this review should be reconsidered
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Appeal Reason</Label>
                                <Textarea
                                  placeholder="Provide a detailed explanation for your appeal..."
                                  value={appealText}
                                  onChange={(e) => setAppealText(e.target.value)}
                                  rows={6}
                                  className="mt-2"
                                />
                              </div>
                              <Button
                                onClick={handleSubmitAppeal}
                                disabled={!appealText.trim()}
                                className="w-full"
                              >
                                Submit Appeal
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Review Content:</p>
                      <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
                    </div>

                    {review.moderation_reason && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                          Moderation Reason:
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          {review.moderation_reason}
                        </p>
                      </div>
                    )}

                    {review.flag_reason && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                          Flag Reason:
                        </p>
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          {review.flag_reason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ReviewAppeals() {
  return (
    <ProtectedRoute allowedRoles={['specialist']}>
      <ReviewAppealsContent />
    </ProtectedRoute>
  );
}
