import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Star, User, Calendar, DollarSign, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Favorite {
  id: string;
  specialist_id: string;
  specialists: {
    id: string;
    specialty: string[];
    consultation_fee_min: number;
    currency: string;
    average_rating: number;
    total_reviews: number;
    profiles: {
      first_name: string;
      last_name: string;
      city: string;
      state: string;
    };
  };
}

export default function Favorites() {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <FavoritesContent />
    </ProtectedRoute>
  );
}

function FavoritesContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        specialists (
          id,
          specialty,
          consultation_fee_min,
          currency,
          average_rating,
          total_reviews,
          profiles:user_id (
            first_name,
            last_name,
            city,
            state
          )
        )
      `)
      .eq('patient_id', user.id);

    if (!error && data) {
      setFavorites(data as any);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Favorite Specialists"
      description="Your saved doctors for quick access"
    >
      {favorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No favorite specialists yet</p>
            <Button onClick={() => navigate('/search/specialists')}>Find Specialists</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => (
              <Card key={fav.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        Dr. {fav.specialists.profiles.first_name} {fav.specialists.profiles.last_name}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{fav.specialists.average_rating.toFixed(1)}</span>
                        <span>({fav.specialists.total_reviews})</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {fav.specialists.specialty.slice(0, 2).map((spec) => (
                      <Badge key={spec} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {fav.specialists.profiles.city}, {fav.specialists.profiles.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      From {fav.specialists.currency} {fav.specialists.consultation_fee_min}
                    </span>
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={() => navigate(`/specialist/${fav.specialists.id}`)}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </DashboardLayout>
  );
}
