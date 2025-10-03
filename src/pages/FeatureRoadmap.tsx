import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, TrendingUp } from 'lucide-react';

/**
 * C17 ESSENTIALS - Feature Roadmap & Voting
 * Users vote on features, view roadmap, trial premium features
 */

interface RoadmapVote {
  feature_request: string;
  vote_count: number;
  user_voted: boolean;
}

function FeatureRoadmapContent() {
  const [features, setFeatures] = useState<RoadmapVote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Aggregate votes by feature
      const { data: votes } = await (supabase as any)
        .from('roadmap_votes')
        .select('*');

      const voteMap = new Map<string, { count: number; userVoted: boolean }>();
      
      votes?.forEach((vote: any) => {
        const current = voteMap.get(vote.feature_request) || { count: 0, userVoted: false };
        voteMap.set(vote.feature_request, {
          count: current.count + vote.vote_weight,
          userVoted: current.userVoted || vote.user_id === user.id
        });
      });

      const roadmapFeatures = Array.from(voteMap.entries()).map(([feature, data]) => ({
        feature_request: feature,
        vote_count: data.count,
        user_voted: data.userVoted
      })).sort((a, b) => b.vote_count - a.vote_count);

      setFeatures(roadmapFeatures);
    } catch (error) {
      console.error('Error fetching roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (featureRequest: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from('roadmap_votes')
        .insert({
          user_id: user.id,
          feature_request: featureRequest,
          vote_weight: 1
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Voted",
            description: "You've already voted for this feature",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Vote Recorded",
          description: "Thanks for helping us prioritize!",
        });
        fetchRoadmap();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record vote",
        variant: "destructive",
      });
    }
  };

  const popularFeatures = [
    "Enhanced video quality settings",
    "Offline mode for medical records",
    "Integration with Apple Health",
    "AI-powered appointment scheduling",
    "Group video consultations",
    "Prescription auto-refill reminders",
    "Family account management",
    "In-app health tracking",
    "Multi-language support expansion",
    "Custom appointment reminders"
  ];

  if (loading) {
    return <div className="flex justify-center p-8">Loading roadmap...</div>;
  }

  return (
    <DashboardLayout 
      title="Feature Roadmap" 
      description="Vote on features you'd like to see next"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Requested Features
            </CardTitle>
            <CardDescription>
              Help us prioritize by voting for features you want
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {features.length > 0 ? (
                features.map((feature, idx) => (
                  <div key={feature.feature_request} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{idx + 1}</Badge>
                      <div>
                        <p className="font-medium">{feature.feature_request}</p>
                        <p className="text-sm text-muted-foreground">
                          {feature.vote_count} {feature.vote_count === 1 ? 'vote' : 'votes'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={feature.user_voted ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleVote(feature.feature_request)}
                      disabled={feature.user_voted}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      {feature.user_voted ? 'Voted' : 'Vote'}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Be the first to vote on features!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggest a Feature</CardTitle>
            <CardDescription>
              Don't see your idea? Add it to the roadmap
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {popularFeatures.map((feature) => (
                <Button
                  key={feature}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => handleVote(feature)}
                >
                  <ThumbsUp className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-left">{feature}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function FeatureRoadmap() {
  return (
    <ProtectedRoute>
      <FeatureRoadmapContent />
    </ProtectedRoute>
  );
}
