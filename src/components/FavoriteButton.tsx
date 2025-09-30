import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FavoriteButtonProps {
  specialistId: string;
}

export default function FavoriteButton({ specialistId }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [user, specialistId]);

  const checkFavorite = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('patient_id', user.id)
      .eq('specialist_id', specialistId)
      .single();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('patient_id', user.id)
          .eq('specialist_id', specialistId);

        if (error) throw error;

        setIsFavorite(false);
        toast({
          title: 'Removed',
          description: 'Specialist removed from favorites',
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            patient_id: user.id,
            specialist_id: specialistId,
          });

        if (error) throw error;

        setIsFavorite(true);
        toast({
          title: 'Added',
          description: 'Specialist added to favorites',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorite',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isFavorite ? 'default' : 'outline'}
      size="sm"
      onClick={toggleFavorite}
      disabled={loading}
    >
      <Star className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
      {isFavorite ? 'Favorited' : 'Add to Favorites'}
    </Button>
  );
}
