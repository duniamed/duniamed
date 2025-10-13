import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Star, Calendar, Languages, Shield, MapPin, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MatchedSpecialist {
  id: string;
  name: string;
  specialties: string[];
  match_score: number;
  rating: number;
  next_available: string;
  languages: string[];
  accepts_insurance: boolean;
  distance_km: number;
  avatar_url?: string;
  match_reasons: string[];
  alternative_options?: any[];
}

export function SmartSpecialistRecommendationsEnhanced() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [specialists, setSpecialists] = useState<MatchedSpecialist[]>([]);
  const [suggestedSpecialties, setSuggestedSpecialties] = useState<string[]>([]);

  const searchSpecialists = async () => {
    if (!symptoms.trim()) {
      toast({
        title: 'Enter your symptoms',
        description: 'Please describe what you\'re experiencing',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-specialist-matcher', {
        body: { symptoms: symptoms.trim() }
      });

      if (error) throw error;

      if (data?.specialists) {
        // Calculate match scores
        const scored = data.specialists.map((spec: any) => {
          let score = 0;
          const reasons: string[] = [];

          // Specialty match (40 points)
          if (spec.specialty_match) {
            score += 40;
            reasons.push('Perfect specialty match');
          }

          // Availability < 7 days (20 points)
          const daysUntilAvailable = spec.next_available 
            ? Math.floor((new Date(spec.next_available).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          if (daysUntilAvailable < 7) {
            score += 20;
            reasons.push('Available within a week');
          }

          // High rating 4.5+ (15 points)
          if (spec.rating >= 4.5) {
            score += 15;
            reasons.push('Highly rated (4.5+)');
          }

          // Speaks patient language (10 points)
          if (spec.languages?.includes('en')) {
            score += 10;
            reasons.push('Speaks your language');
          }

          // Accepts insurance (10 points)
          if (spec.accepts_insurance) {
            score += 10;
            reasons.push('Accepts your insurance');
          }

          // Near location < 5km (5 points)
          if (spec.distance_km < 5) {
            score += 5;
            reasons.push('Close to your location');
          }

          return {
            ...spec,
            match_score: score,
            match_reasons: reasons
          };
        });

        // Sort by match score
        scored.sort((a: any, b: any) => b.match_score - a.match_score);
        setSpecialists(scored);
        
        if (data.suggested_specialties) {
          setSuggestedSpecialties(data.suggested_specialties);
        }
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: 'Search failed',
        description: error.message || 'Could not find specialists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (specialistId: string) => {
    navigate(`/book-appointment?specialist=${specialistId}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-500/10';
    if (score >= 60) return 'text-blue-500 bg-blue-500/10';
    if (score >= 40) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-orange-500 bg-orange-500/10';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          AI-Powered Specialist Matching
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Describe your symptoms - we'll find the perfect specialist for you
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g., chest pain, fever, headache..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchSpecialists()}
              className="pl-10"
            />
          </div>
          <Button onClick={searchSpecialists} disabled={loading}>
            {loading ? 'Searching...' : 'Find Specialists'}
          </Button>
        </div>

        {/* Suggested Specialties */}
        {suggestedSpecialties.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Suggested:</span>
            {suggestedSpecialties.map((specialty, idx) => (
              <Badge key={idx} variant="secondary" className="cursor-pointer">
                {specialty}
              </Badge>
            ))}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && specialists.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-primary">
              Found {specialists.length} matching specialists
            </p>
            {specialists.map((specialist) => (
              <Card key={specialist.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={specialist.avatar_url} />
                      <AvatarFallback className="text-lg">
                        {specialist.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{specialist.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {specialist.specialties.map((spec, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {/* Match Score */}
                        <div className={`px-4 py-2 rounded-lg ${getScoreColor(specialist.match_score)}`}>
                          <p className="text-2xl font-bold">{specialist.match_score}</p>
                          <p className="text-xs">Match Score</p>
                        </div>
                      </div>

                      {/* Why This Match? */}
                      {specialist.match_reasons.length > 0 && (
                        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                          <p className="text-xs font-semibold text-blue-500 mb-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Why this match?
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {specialist.match_reasons.map((reason, idx) => (
                              <span key={idx} className="text-xs text-blue-500">
                                ✓ {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{specialist.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <span>{new Date(specialist.next_available).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Languages className="h-4 w-4 text-purple-500" />
                          <span>{specialist.languages.join(', ')}</span>
                        </div>
                        {specialist.accepts_insurance && (
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span className="text-blue-500">Accepts Insurance</span>
                          </div>
                        )}
                        {specialist.distance_km && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            <span>{specialist.distance_km.toFixed(1)} km away</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => handleBookNow(specialist.id)} size="lg">
                          Book Now
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg"
                          onClick={() => navigate(`/specialists/${specialist.id}`)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && specialists.length === 0 && symptoms && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No specialists found. Try different symptoms or contact support.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
