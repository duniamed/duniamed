import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AlertCircle, CheckCircle2, Clock, MessageSquare, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Review {
  id: string;
  rating: number;
  comment: string;
  clinical_feedback: string;
  administrative_feedback: string;
  moderation_status: string;
  moderation_reason: string;
  appeal_status: string;
  created_at: string;
  is_flagged: boolean;
  patient_id: string;
}

export default function ReviewModeration() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [appealText, setAppealText] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
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

  const handleAppeal = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ appeal_status: 'pending' })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: 'Appeal submitted',
        description: 'Your appeal has been submitted for review',
      });

      loadReviews();
      setAppealText('');
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
      case 'published':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'flagged':
      case 'under_review':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading reviews...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Review Moderation</h1>
          </div>
          <p className="text-muted-foreground">
            Manage patient reviews with full transparency
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Published Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reviews.filter(r => r.moderation_status === 'published').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {reviews.filter(r => ['flagged', 'under_review'].includes(r.moderation_status)).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Appeals Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reviews.filter(r => r.appeal_status === 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className={review.is_flagged ? 'border-yellow-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(review.moderation_status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">Rating: {review.rating}/5</CardTitle>
                        <Badge variant={
                          review.moderation_status === 'published' ? 'default' :
                          review.moderation_status === 'flagged' ? 'destructive' : 'secondary'
                        }>
                          {review.moderation_status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {new Date(review.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>

                  {review.moderation_status === 'flagged' && review.appeal_status !== 'pending' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Appeal
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Appeal Review Moderation</DialogTitle>
                          <DialogDescription>
                            Explain why you believe this review should be published
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="Your appeal message..."
                          value={appealText}
                          onChange={(e) => setAppealText(e.target.value)}
                          rows={4}
                        />
                        <Button onClick={() => handleAppeal(review.id)}>
                          Submit Appeal
                        </Button>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {review.comment && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Patient Comment:</h4>
                    <p className="text-sm">{review.comment}</p>
                  </div>
                )}

                {review.clinical_feedback && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Clinical Feedback:</h4>
                    <p className="text-sm">{review.clinical_feedback}</p>
                  </div>
                )}

                {review.administrative_feedback && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Administrative Feedback:</h4>
                    <p className="text-sm">{review.administrative_feedback}</p>
                  </div>
                )}

                {review.moderation_reason && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-1 text-yellow-800 dark:text-yellow-200">
                      Moderation Reason:
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {review.moderation_reason}
                    </p>
                  </div>
                )}

                {review.appeal_status === 'pending' && (
                  <Badge variant="outline" className="text-blue-600">
                    Appeal under review - 48 hour decision window
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}

          {reviews.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No reviews yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
