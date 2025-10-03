import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Flag, Eye, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminReviewVisibility() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [flagFilter, setFlagFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [flagFilter, showAll]);

  const loadReviews = async () => {
    try {
      const query = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('is_hidden', showAll ? undefined : false);

      const { data, error } = await query;

      if (error) throw error;

      let filtered = data || [];

      if (flagFilter === 'flagged') {
        filtered = filtered.filter(r => r.flags && r.flags.length > 0);
      } else if (flagFilter === 'pending') {
        filtered = filtered.filter(r =>
          r.flags && r.flags.some((f: any) => f.status === 'pending')
        );
      }

      setReviews(filtered);
    } catch (error: any) {
      toast({
        title: "Error loading reviews",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review =>
    review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.patient?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.specialist?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const flagReview = async (reviewId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('review_flags')
        .insert({
          review_id: reviewId,
          flagged_by: user.id,
          flag_reason: reason,
          flag_type: 'other'
        });

      if (error) throw error;

      toast({
        title: "Review flagged",
        description: "This review has been flagged for moderation",
      });

      loadReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <Layout><div className="p-8">Loading reviews...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Eye className="h-8 w-8" />
            Review Visibility (C9)
          </h1>
          <p className="text-muted-foreground mt-2">
            Full transparency - View and search all reviews with moderation status
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews by keyword, content, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={flagFilter} onValueChange={setFlagFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showAll ? "default" : "outline"}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Hide Hidden' : 'Show All'}
          </Button>
        </div>

        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className={review.is_hidden ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {review.patient?.first_name} {review.patient?.last_name}
                      <Badge variant="outline" className="ml-2">
                        {review.rating} ⭐
                      </Badge>
                      {review.is_hidden && (
                        <Badge variant="destructive" className="ml-2">
                          Hidden
                        </Badge>
                      )}
                      {review.flags && review.flags.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          <Flag className="h-3 w-3 mr-1" />
                          {review.flags.length} flags
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      For: {review.specialist?.user?.first_name} {review.specialist?.user?.last_name}
                      {' • '}
                      {new Date(review.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{review.comment}</p>

                {review.flags && review.flags.length > 0 && (
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <p className="font-medium mb-2">Moderation Flags:</p>
                    {review.flags.map((flag: any) => (
                      <div key={flag.id} className="text-sm mb-2">
                        <Badge variant="outline" className="mr-2">
                          {flag.flag_type}
                        </Badge>
                        {flag.flag_reason}
                        <span className="text-muted-foreground ml-2">
                          • {flag.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => flagReview(review.id, 'Requires moderation review')}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Flag Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredReviews.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No reviews found matching your criteria</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
