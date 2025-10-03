import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, DollarSign, Shield, Award } from 'lucide-react';

interface TransparencyBadgeProps {
  type: 'verified' | 'sponsored' | 'promoted' | 'audited';
  details?: string;
}

export function TransparencyBadge({ type, details }: TransparencyBadgeProps) {
  const badges = {
    verified: {
      icon: CheckCircle2,
      label: 'Verified',
      color: 'bg-green-500',
      description: 'Credentials verified by independent authority'
    },
    sponsored: {
      icon: DollarSign,
      label: 'Sponsored',
      color: 'bg-blue-500',
      description: 'Paid promotion - This is a sponsored listing'
    },
    promoted: {
      icon: Award,
      label: 'Promoted',
      color: 'bg-purple-500',
      description: 'Featured listing - Paid for higher visibility'
    },
    audited: {
      icon: Shield,
      label: 'Third-Party Audited',
      color: 'bg-indigo-500',
      description: 'Independently audited for quality and compliance'
    }
  };

  const badge = badges[type];
  const Icon = badge.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${badge.color} text-white border-0 cursor-help`}
          >
            <Icon className="h-3 w-3 mr-1" />
            {badge.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{badge.description}</p>
          {details && <p className="text-xs mt-1 text-muted-foreground">{details}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
