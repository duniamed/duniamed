import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Star, TrendingUp, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

/**
 * C10 PROCEDURES - Match Notifications Component
 * 
 * PURPOSE:
 * - Display procedure matches to patients
 * - Show match scores and reasons
 * - Allow booking appointments with matched specialists
 * 
 * WORKFLOW:
 * 1. Load unviewed matches for current patient
 * 2. Display match cards with specialist info
 * 3. Mark as viewed when patient sees them
 * 4. Enable direct booking with matched specialists
 */

interface ProcedureMatch {
  id: string;
  match_score: number;
  match_reason: any;
  patient_viewed: boolean;
  created_at: string;
  procedure_catalog: {
    procedure_name: string;
    category: string;
  };
  specialists: {
    id: string;
    user_id: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function ProcedureMatchNotifications() {
  const [matches, setMatches] = useState<ProcedureMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMatches();
    subscribeToMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('procedure_matches')
        .select(`
          *,
          procedure_catalog!procedure_matches_procedure_id_fkey(procedure_name, category),
          specialists!procedure_matches_specialist_id_fkey(
            id,
            user_id,
            profiles!specialists_user_id_fkey(first_name, last_name)
          )
        `)
        .eq('patient_id', user.id)
        .eq('patient_viewed', false)
        .order('match_score', { ascending: false })
        .limit(5);

      if (error) throw error;
      setMatches((data || []) as any);
    } catch (error: any) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMatches = () => {
    const channel = supabase
      .channel('procedure_matches_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'procedure_matches',
        },
        () => {
          loadMatches();
          toast({
            title: 'New Specialist Match!',
            description: 'We found a specialist that matches your procedure search',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsViewed = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('procedure_matches')
        .update({ patient_viewed: true })
        .eq('id', matchId);

      if (error) throw error;

      setMatches(matches.filter(m => m.id !== matchId));
    } catch (error: any) {
      console.error('Error marking match as viewed:', error);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getMatchScoreBadge = (score: number) => {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    return 'Potential Match';
  };

  if (loading) {
    return null;
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          New Specialist Matches ({matches.length})
        </CardTitle>
        <CardDescription>
          We found specialists that match your procedure interests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {matches.map((match) => (
          <div key={match.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Dr. {match.specialists.profiles.first_name} {match.specialists.profiles.last_name}
                  <Badge variant="outline">
                    {match.procedure_catalog.category}
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {match.procedure_catalog.procedure_name}
                </p>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-1 font-semibold ${getMatchScoreColor(match.match_score)}`}>
                  <TrendingUp className="h-4 w-4" />
                  {Math.round(match.match_score * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {getMatchScoreBadge(match.match_score)}
                </p>
              </div>
            </div>

            {match.match_reason && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>
                  {match.match_reason.proficiency} level •{' '}
                  {match.match_reason.accepting_patients ? 'Accepting patients' : ''}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" asChild>
                <Link to={`/book/${match.specialists.user_id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAsViewed(match.id)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
