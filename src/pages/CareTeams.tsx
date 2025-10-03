import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Plus, UserPlus, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CareTeams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    team_type: 'multidisciplinary'
  });

  useEffect(() => {
    loadTeams();
  }, [user]);

  const loadTeams = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('care_teams')
        .select(`
          *,
          care_team_members(
            id,
            role_in_team,
            specialist:specialist_id(
              id,
              specialty,
              user:user_id(first_name, last_name)
            )
          ),
          lead:lead_specialist_id(
            specialty,
            user:user_id(first_name, last_name)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load care teams',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!user || !newTeam.name) return;

    setCreating(true);
    try {
      const { error } = await supabase
        .from('care_teams')
        .insert({
          ...newTeam,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Team created',
        description: 'Your care team has been created successfully.'
      });

      setNewTeam({ name: '', description: '', team_type: 'multidisciplinary' });
      loadTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Care Teams</h1>
            <p className="text-muted-foreground mt-2">
              Coordinate multi-disciplinary care and manage referrals
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Care Team</DialogTitle>
                <DialogDescription>
                  Build a multidisciplinary team to coordinate patient care
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="e.g., Cardiology Care Team"
                  />
                </div>
                <div>
                  <Label htmlFor="team-type">Team Type</Label>
                  <Select
                    value={newTeam.team_type}
                    onValueChange={(value) => setNewTeam({ ...newTeam, team_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multidisciplinary">Multidisciplinary</SelectItem>
                      <SelectItem value="specialist_group">Specialist Group</SelectItem>
                      <SelectItem value="primary_care">Primary Care</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="team-description">Description</Label>
                  <Textarea
                    id="team-description"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Describe the team's focus and coordination approach..."
                    rows={3}
                  />
                </div>
                <Button onClick={createTeam} disabled={creating} className="w-full">
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No care teams yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a team to coordinate multi-provider care
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Care Team</DialogTitle>
                    <DialogDescription>
                      Build a multidisciplinary team to coordinate patient care
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="team-name-2">Team Name</Label>
                      <Input
                        id="team-name-2"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                        placeholder="e.g., Cardiology Care Team"
                      />
                    </div>
                    <div>
                      <Label htmlFor="team-type-2">Team Type</Label>
                      <Select
                        value={newTeam.team_type}
                        onValueChange={(value) => setNewTeam({ ...newTeam, team_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multidisciplinary">Multidisciplinary</SelectItem>
                          <SelectItem value="specialist_group">Specialist Group</SelectItem>
                          <SelectItem value="primary_care">Primary Care</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="team-description-2">Description</Label>
                      <Textarea
                        id="team-description-2"
                        value={newTeam.description}
                        onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                        placeholder="Describe the team's focus and coordination approach..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={createTeam} disabled={creating} className="w-full">
                      {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Team
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {team.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {team.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {team.team_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {team.lead && (
                    <div className="text-sm">
                      <span className="font-medium">Team Lead:</span>{' '}
                      {team.lead.user?.first_name} {team.lead.user?.last_name} ({team.lead.specialty})
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Team Members ({team.care_team_members?.length || 0})</p>
                    {team.care_team_members && team.care_team_members.length > 0 ? (
                      <div className="space-y-2">
                        {team.care_team_members.slice(0, 3).map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                            <span>
                              {member.specialist?.user?.first_name} {member.specialist?.user?.last_name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {member.role_in_team}
                            </Badge>
                          </div>
                        ))}
                        {team.care_team_members.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            +{team.care_team_members.length - 3} more members
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No members yet</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Team Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
