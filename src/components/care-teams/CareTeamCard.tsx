import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface CareTeamCardProps {
  team: {
    id: string;
    name: string;
    description: string;
    team_type: string;
    member_count: number;
    is_active: boolean;
  };
  onSelect?: (teamId: string) => void;
}

export const CareTeamCard: React.FC<CareTeamCardProps> = ({ team, onSelect }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onSelect?.(team.id)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {team.name}
        </CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {team.description}
        </p>
        <div className="flex items-center justify-between">
          <Badge variant={team.is_active ? "default" : "secondary"}>
            {team.team_type}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {team.member_count} members
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
