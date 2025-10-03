import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Star, MessageSquare, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate } from 'react-router-dom';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  is_anonymous: boolean;
  moderation_status: string;
}

function ReviewResponseContent() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [existingResponse, setExistingResponse] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (reviewId) {
      loadReview();
      loadExistingResponse();
    }
  }, [reviewId]);

  const loadReview = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single();

      if (error) throw error;
      setReview(data);
    } catch (error: any) {
      toast({
        title: 'Error loading review',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingResponse = async () => {
    try {
      const { data } = await supabase
        .from('review_responses' as any)
        .select('*')
        .eq('review_id', reviewId)
        .maybeSingle();

      if (data) {
        setExistingResponse(data);
        setResponseText((data as any).response_text || '');
        setIsPublic((data as any).is_public !== false);
      }
    } catch (error: any) {
      console.error('Error loading response:', error);
    }
  };

  const handleSubmit = async () => {
    if (!responseText.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) throw new Error('Specialist profile not found');

      if (existingResponse) {
        // Update existing response
        const { error } = await supabase
          .from('review_responses' as any)
          .update({
            response_text: responseText,
            is_public: isPublic,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingResponse.id);

        if (error) throw error;

        toast({
          title: 'Response updated',
          description: 'Your response has been updated successfully',
        });
      } else {
        // Create new response
        const { error } = await supabase
          .from('review_responses' as any)
          .insert({
            review_id: reviewId,
            specialist_id: specialist.id,
            response_text: responseText,
            is_public: isPublic,
            phi_redacted: false
          });

        if (error) throw error;

        toast({
          title: 'Response published',
          description: 'Your response has been published successfully',
        });
      }

      navigate('/specialist/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error submitting response',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading review...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!review) {
    return (
      <DashboardLayout>
        <div className="container-modern py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Review Not Found</h3>
              <p className="text-muted-foreground">
                This review could not be found or you don't have permission to respond
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container-modern py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              Respond to Review
            </h1>
            <p className="text-muted-foreground mt-2">
              Craft a professional response to patient feedback
            </p>
          </div>

          {/* Original Review */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Patient Review</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    {renderStars(review.rating)}
                    <span>•</span>
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                    {review.is_anonymous && <Badge variant="outline">Anonymous</Badge>}
                  </CardDescription>
                </div>
                <Badge variant={review.moderation_status === 'published' ? 'default' : 'secondary'}>
                  {review.moderation_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
            </CardContent>
          </Card>

          {/* Response Form */}
          <Card>
            <CardHeader>
              <CardTitle>Your Response</CardTitle>
              <CardDescription>
                {existingResponse
                  ? 'Edit your response to this review'
                  : 'Write a professional response that addresses the patient\'s feedback'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-1">Best Practices:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                      <li>Thank the patient for their feedback</li>
                      <li>Address specific concerns professionally</li>
                      <li>Avoid discussing protected health information</li>
                      <li>Keep response concise and empathetic</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="response">Response Text</Label>
                <Textarea
                  id="response"
                  placeholder="Thank you for your feedback..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={8}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {responseText.length} characters
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="public-response" className="font-medium">
                    Public Response
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Make this response visible to all visitors
                  </p>
                </div>
                <Switch
                  id="public-response"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/specialist/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!responseText.trim()}
                  className="flex-1"
                >
                  {existingResponse ? 'Update Response' : 'Publish Response'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ReviewResponse() {
  return (
    <ProtectedRoute allowedRoles={['specialist']}>
      <ReviewResponseContent />
    </ProtectedRoute>
  );
}
