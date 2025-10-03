import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Filter, Search, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  rating: number;
  comment: string;
  moderation_status: string;
  moderation_reason: string | null;
  censored_content: string | null;
  published_at: string | null;
  created_at: string;
  is_anonymous: boolean;
  patient_id: string;
  specialist_id: string;
  specialists: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  } | null;
}

function BrowseReviewsContent() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showCensored, setShowCensored] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reviews, filter, search, showCensored]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          specialists!reviews_specialist_id_fkey (
            user_id,
            profiles!specialists_user_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .in('moderation_status', showCensored ? ['published', 'censored'] : ['published'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to match interface, handling missing fields
      const mappedData: Review[] = (data || []).map((item: any) => ({
        id: item.id,
        rating: item.rating,
        comment: item.comment,
        moderation_status: item.moderation_status,
        moderation_reason: item.moderation_reason || null,
        censored_content: item.censored_content || null,
        published_at: item.published_at || null,
        created_at: item.created_at,
        is_anonymous: item.is_anonymous,
        patient_id: item.patient_id,
        specialist_id: item.specialist_id,
        specialists: item.specialists
      }));
      
      setReviews(mappedData);
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

  const applyFilters = () => {
    let filtered = [...reviews];

    // Rating filter
    if (filter === 'positive') {
      filtered = filtered.filter(r => r.rating >= 4);
    } else if (filter === 'negative') {
      filtered = filtered.filter(r => r.rating <= 2);
    } else if (filter === 'censored') {
      filtered = filtered.filter(r => r.moderation_status === 'censored');
    }

    // Search filter
    if (search) {
      filtered = filtered.filter(r =>
        r.comment?.toLowerCase().includes(search.toLowerCase()) ||
        r.specialists?.profiles?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.specialists?.profiles?.last_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredReviews(filtered);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      published: 'default',
      censored: 'secondary',
      flagged: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Layout>
      <div className="container-modern py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Provider Reviews</h1>
            <p className="text-muted-foreground">
              Browse verified patient experiences and ratings
            </p>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating Filter</label>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reviews</SelectItem>
                      <SelectItem value="positive">Positive (4-5 ⭐)</SelectItem>
                      <SelectItem value="negative">Negative (1-2 ⭐)</SelectItem>
                      <SelectItem value="censored">Censored Reviews</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reviews..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    variant={showCensored ? 'default' : 'outline'}
                    onClick={() => setShowCensored(!showCensored)}
                    className="w-full"
                  >
                    {showCensored ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                    {showCensored ? 'Show All' : 'Show Censored'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </div>

          {/* Reviews list */}
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading reviews...
              </CardContent>
            </Card>
          ) : filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No reviews found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Dr. {review.specialists?.profiles?.first_name} {review.specialists?.profiles?.last_name}
                          {review.is_anonymous && <Badge variant="outline">Anonymous Review</Badge>}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-3 mt-1">
                          {renderStars(review.rating)}
                          <span>•</span>
                          <span>{new Date(review.created_at).toLocaleDateString()}</span>
                          {review.moderation_status !== 'published' && (
                            <>
                              <span>•</span>
                              {getStatusBadge(review.moderation_status)}
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Show censored version if applicable */}
                    {review.moderation_status === 'censored' && review.censored_content ? (
                      <>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-start gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Content Moderated</p>
                              <p className="text-xs text-muted-foreground">
                                This review was modified to remove sensitive information
                              </p>
                            </div>
                          </div>
                          <p className="text-sm">{review.censored_content}</p>
                        </div>
                        {review.moderation_reason && (
                          <p className="text-xs text-muted-foreground">
                            Reason: {review.moderation_reason}
                          </p>
                        )}
                      </>
                    ) : (
                      <p>{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function BrowseReviews() {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <BrowseReviewsContent />
    </ProtectedRoute>
  );
}
