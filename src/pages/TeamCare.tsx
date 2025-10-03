import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, UserPlus, Calendar, ArrowRight, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface CareTeam {
  id: string;
  team_name: string;
  team_type: string;
  specialties: string[];
  is_active: boolean;
  created_at: string;
}

interface Referral {
  id: string;
  patient_id: string;
  referring_specialist_id: string;
  referral_reason: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function TeamCare() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<CareTeam[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load care teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('care_teams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Load referrals
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: referralsData, error: referralsError } = await supabase
          .from('referrals')
          .select('*')
          .or(`patient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (referralsError) throw referralsError;
        setReferrals(referralsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load team care data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500',
      routine: 'bg-blue-500',
      follow_up: 'bg-green-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      accepted: 'bg-green-500',
      declined: 'bg-red-500',
      completed: 'bg-blue-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Team-Based Care
            <InfoTooltip content="Coordinate care with multiple specialists. View your care teams, track referrals, and schedule multi-provider appointments for comprehensive treatment." />
          </h1>
          <p className="text-muted-foreground mt-2">
            Coordinate your care across multiple specialists and providers
          </p>
        </div>

        <div className="grid gap-6">
          {/* Available Care Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Available Care Teams
                <InfoTooltip content="Browse multidisciplinary care teams. These teams bring together specialists from different fields to provide coordinated, comprehensive care." />
              </CardTitle>
              <CardDescription>
                Explore specialized teams for coordinated treatment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No care teams available
                </p>
              ) : (
                <div className="grid gap-4">
                  {teams.map((team) => (
                    <div key={team.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{team.team_name}</h3>
                          <Badge variant="outline" className="mt-1">
                            {team.team_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Button size="sm">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Join Team
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {team.specialties.map((specialty, idx) => (
                          <Badge key={idx} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Established: {new Date(team.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Referrals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Your Referrals
                <InfoTooltip content="Track referrals between specialists. View status, priority, and handoff notes to understand your care journey across providers." />
              </CardTitle>
              <CardDescription>
                Track your specialist referrals and transitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No active referrals
                </p>
              ) : (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(referral.priority)}>
                            {referral.priority}
                          </Badge>
                          <Badge className={getStatusColor(referral.status)}>
                            {referral.status}
                          </Badge>
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Reason for Referral</p>
                          <p className="text-sm text-muted-foreground">{referral.referral_reason}</p>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Referred: {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {referral.status === 'accepted' && (
                        <Button className="w-full mt-3" size="sm">
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Team Appointment
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benefits Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Benefits of Team-Based Care</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Access multiple specialists who communicate and coordinate your treatment</span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Schedule joint appointments to reduce travel and get comprehensive care faster</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Seamless handoffs between specialists with shared care plans and notes</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
