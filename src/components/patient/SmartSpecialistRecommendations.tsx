import { useState } from 'react';
import { Search, Calendar, DollarSign, Star, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export function SmartSpecialistRecommendations() {
  const [symptoms, setSymptoms] = useState('');
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedSpecialties, setSuggestedSpecialties] = useState<string[]>([]);
  const { toast } = useToast();

  const searchSpecialists = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "Please describe your symptoms",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('smart-specialist-matcher', {
        body: {
          symptoms,
          patientId: userData?.user?.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setSpecialists(data.specialists);
        setSuggestedSpecialties(data.suggestedSpecialties || []);
        toast({
          title: "Found Specialists",
          description: `${data.specialists.length} specialists matched`
        });
      }
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookNow = (specialistId: string) => {
    // Navigate to booking page with pre-filled specialist
    window.location.href = `/book-appointment?specialist=${specialistId}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find the Right Specialist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Describe your symptoms... (e.g., chest pain, headache)"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchSpecialists()}
                className="pl-10"
              />
            </div>
            <Button onClick={searchSpecialists} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Find Specialists'}
            </Button>
          </div>

          {suggestedSpecialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Recommended specialties:</span>
              {suggestedSpecialties.map(specialty => (
                <Badge key={specialty} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isSearching && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      )}

      {!isSearching && specialists.length > 0 && (
        <div className="space-y-4">
          {specialists.map(specialist => (
            <Card key={specialist.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={specialist.profiles.avatar_url} />
                    <AvatarFallback>
                      {specialist.profiles.first_name?.[0]}{specialist.profiles.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Dr. {specialist.profiles.first_name} {specialist.profiles.last_name}
                        </h3>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {specialist.specialty.map((s: string) => (
                            <Badge key={s} variant="outline">{s}</Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="default" className="text-lg">
                        {specialist.matchScore}% Match
                      </Badge>
                    </div>

                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{specialist.average_rating?.toFixed(1) || 'New'}</span>
                        <span>({specialist.total_reviews || 0} reviews)</span>
                      </div>
                      
                      {specialist.daysUntilAvailable < 999 && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {specialist.daysUntilAvailable === 0 
                              ? 'Available today'
                              : `Available in ${specialist.daysUntilAvailable} day${specialist.daysUntilAvailable > 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <span className="capitalize">{specialist.languages.join(', ')}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleBookNow(specialist.id)}
                        className="flex-1"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Book Now
                      </Button>
                      <Button variant="outline">
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
    </div>
  );
}