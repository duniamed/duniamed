import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';

interface CSATRatingProps {
  ticketId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function CSATRating({ ticketId, onClose, onSubmitted }: CSATRatingProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('support_ticket_ratings')
        .insert({
          ticket_id: ticketId,
          rating,
          feedback: feedback.trim() || null,
          rated_by: user.id
        });

      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve our support"
      });

      onSubmitted?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-10 w-10 ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Support Experience</DialogTitle>
          <DialogDescription>
            How would you rate the support you received?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            {renderStars()}
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 1 && "We're sorry to hear that. How can we improve?"}
                {rating === 2 && "We'd like to do better. Please share your thoughts."}
                {rating === 3 && "Thanks! Any suggestions for improvement?"}
                {rating === 4 && "Great! What did we do well?"}
                {rating === 5 && "Excellent! We're glad we could help!"}
              </p>
            )}
          </div>

          {rating > 0 && (
            <div className="space-y-2">
              <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Tell us more about your experience..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rating === 0}>
            {loading ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
