import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Stethoscope, Building2 } from 'lucide-react';

interface CareTeamMember {
  id: string;
  role: string;
  relationship_type: string;
  started_at: string;
  specialist?: {
    user_id: string;
    specialty: string[];
    user: {
      first_name: string;
      last_name: string;
    };
  };
  clinic?: {
    name: string;
  };
}

interface PatientCareTeamProps {
  patientId: string;
}

export function PatientCareTeam({ patientId }: PatientCareTeamProps) {
  const [careTeam, setCareTeam] = useState<CareTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCareTeam();
  }, [patientId]);

  const loadCareTeam = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_care_team')
        .select(`
          *,
          specialist:specialists(
            user_id,
            specialty,
            user:profiles!user_id(first_name, last_name)
          ),
          clinic:clinics(name)
        `)
        .eq('patient_id', patientId)
        .eq('relationship_type', 'active')
        .order('started_at', { ascending: false });

      if (error) throw error;
      setCareTeam(data || []);
    } catch (error) {
      console.error('Error loading care team:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading care team...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Care Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        {careTeam.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No care team members yet</p>
        ) : (
          <div className="space-y-4">
            {careTeam.map((member) => (
              <div key={member.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar>
                  <AvatarFallback>
                    {member.specialist ? (
                      <Stethoscope className="h-4 w-4" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {member.specialist
                          ? `Dr. ${member.specialist.user.first_name} ${member.specialist.user.last_name}`
                          : member.clinic?.name || 'Unknown'}
                      </p>
                      {member.specialist && member.specialist.specialty && (
                        <p className="text-sm text-muted-foreground">
                          {member.specialist.specialty.join(', ')}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{member.role.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Since {new Date(member.started_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
