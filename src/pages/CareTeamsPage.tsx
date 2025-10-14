import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CareTeamCard } from '@/components/care-teams/CareTeamCard';
import { Plus, Users } from 'lucide-react';

export const CareTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (specialist) {
        const { data } = await supabase
          .from('care_team_members')
          .select(`
            *,
            care_teams (
              *
            )
          `)
          .eq('specialist_id', specialist.id);

        const uniqueTeams = data?.map(d => d.care_teams).filter(Boolean) || [];
        setTeams(uniqueTeams as any);
      }
    } catch (error) {
      console.error('Load teams error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Care Teams</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <CareTeamCard
              key={team.id}
              team={{
                ...team,
                member_count: 0
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">You are not part of any care teams yet</p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
