import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Send, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ReviewResponses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    loadReviewsNeedingResponse();
  }, [user]);

  const loadReviewsNeedingResponse = async () => {
    if (!user) return;
    
    try {
      // Get specialist ID first
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) {
        setLoading(false);
        return;
      }

      // Load reviews without responses
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          *,
          review_responses(id, response_text, is_public, created_at),
          profiles:patient_id(first_name, last_name)
        `)
        .eq('specialist_id', specialist.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (reviewId: string) => {
    if (!user || !responseText.trim()) return;

    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) throw new Error('Specialist not found');

      const { error } = await supabase
        .from('review_responses')
        .insert([{
          review_id: reviewId,
          responder_id: user.id,
          response_text: responseText,
          is_public: isPublic
        }]);

      if (error) throw error;

      toast({
        title: 'Response submitted',
        description: 'Your response has been posted successfully.'
      });

      setResponseText('');
      setResponding(null);
      loadReviewsNeedingResponse();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit response',
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Review Responses</h1>
          <p className="text-muted-foreground mt-2">
            Respond to patient reviews professionally and transparently
          </p>
        </div>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No reviews yet</p>
              <p className="text-sm text-muted-foreground">
                Reviews from patients will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {review.profiles?.first_name} {review.profiles?.last_name}
                        <Badge variant={review.rating >= 4 ? 'default' : 'destructive'}>
                          {review.rating}/5
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {new Date(review.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {review.review_responses?.[0] && (
                      <Badge variant="outline">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Responded
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{review.comment}</p>

                  {review.review_responses?.[0] ? (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Your Response:</p>
                        <Badge variant={review.review_responses[0].is_public ? 'default' : 'secondary'}>
                          {review.review_responses[0].is_public ? (
                            <><Eye className="h-3 w-3 mr-1" /> Public</>
                          ) : (
                            <><EyeOff className="h-3 w-3 mr-1" /> Private</>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.review_responses[0].response_text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.review_responses[0].created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ) : responding === review.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Your Response</Label>
                        <Textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Write a professional, empathetic response..."
                          rows={4}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={isPublic}
                          onCheckedChange={setIsPublic}
                          id="public-response"
                        />
                        <Label htmlFor="public-response">
                          Make response public (visible to all users)
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => submitResponse(review.id)}>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Response
                        </Button>
                        <Button variant="outline" onClick={() => setResponding(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setResponding(review.id)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Respond to Review
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
