import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star, ThumbsUp, MessageSquare, UserCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface BilateralRatingProps {
  appointmentId: string;
  ratingType: 'patient_rates_specialist' | 'specialist_rates_patient';
  targetId: string;
  targetName: string;
  onComplete?: () => void;
}

export default function BilateralRating({
  appointmentId,
  ratingType,
  targetId,
  targetName,
  onComplete
}: BilateralRatingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [punctuality, setPunctuality] = useState('');
  const [communication, setCommunication] = useState('');
  const [professionalism, setProfessionalism] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isPatientRating = ratingType === 'patient_rates_specialist';

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a star rating',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);

      const ratingData = {
        appointment_id: appointmentId,
        rating_type: ratingType,
        rated_user_id: targetId,
        rating_value: rating,
        comment: comment.trim() || null,
        rating_dimensions: {
          punctuality,
          communication,
          professionalism
        }
      };

      const { data, error } = await supabase.functions.invoke('submit-bilateral-rating', {
        body: ratingData
      });

      if (error) throw error;

      toast({
        title: '✅ Rating Submitted',
        description: data.message || 'Thank you for your feedback'
      });

      onComplete?.();
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Rate {isPatientRating ? 'Your Specialist' : 'Your Patient'}
        </CardTitle>
        <CardDescription>
          Help improve the community by providing honest feedback for {targetName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-2">
          <Label>Overall Rating</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Rating Dimensions */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              {isPatientRating ? 'Professional Conduct' : 'Patient Cooperation'}
            </Label>
            <RadioGroup value={professionalism} onValueChange={setProfessionalism}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excellent" id="prof-excellent" />
                <Label htmlFor="prof-excellent">Excellent</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="good" id="prof-good" />
                <Label htmlFor="prof-good">Good</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fair" id="prof-fair" />
                <Label htmlFor="prof-fair">Fair</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="poor" id="prof-poor" />
                <Label htmlFor="prof-poor">Poor</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Communication Quality
            </Label>
            <RadioGroup value={communication} onValueChange={setCommunication}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excellent" id="comm-excellent" />
                <Label htmlFor="comm-excellent">Excellent</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="good" id="comm-good" />
                <Label htmlFor="comm-good">Good</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fair" id="comm-fair" />
                <Label htmlFor="comm-fair">Fair</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="poor" id="comm-poor" />
                <Label htmlFor="comm-poor">Poor</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              Punctuality
            </Label>
            <RadioGroup value={punctuality} onValueChange={setPunctuality}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="on_time" id="punct-on-time" />
                <Label htmlFor="punct-on-time">On Time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="slightly_late" id="punct-slight" />
                <Label htmlFor="punct-slight">Slightly Late (5-10 min)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="very_late" id="punct-very" />
                <Label htmlFor="punct-very">Very Late (&gt;10 min)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no_show" id="punct-no-show" />
                <Label htmlFor="punct-no-show">Did Not Show</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment">Additional Comments (Optional)</Label>
          <Textarea
            id="comment"
            placeholder={
              isPatientRating
                ? 'Share your experience with this specialist...'
                : 'Provide feedback about this patient encounter...'
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground">{comment.length}/1000 characters</p>
        </div>

        {/* Privacy Notice */}
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="text-muted-foreground">
            {isPatientRating
              ? '🔒 Your rating helps maintain quality care. Reviews are moderated for inappropriate content.'
              : '🔒 Patient ratings are confidential and used to improve care coordination. Low ratings trigger support, not penalties.'}
          </p>
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </Button>
      </CardContent>
    </Card>
  );
}
