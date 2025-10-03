import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Award, TrendingUp, DollarSign } from 'lucide-react';

/**
 * C8 TRANSPARENCY - Verification and Sponsorship Badges
 * 
 * DISPLAYS:
 * - Verified Quality (credential verification passed)
 * - Paid Sponsorship (promoted listings)
 * - Insurance Accepted (transparent fee information)
 * - Audit Certified (third-party verification)
 */

interface TransparencyBadgesProps {
  isVerified?: boolean;
  sponsorshipType?: 'featured' | 'premium' | 'promoted' | null;
  insuranceAccepted?: string[];
  auditCertified?: boolean;
  showLabels?: boolean;
}

export function TransparencyBadges({
  isVerified,
  sponsorshipType,
  insuranceAccepted,
  auditCertified,
  showLabels = true
}: TransparencyBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        {/* Verified Quality Badge */}
        {isVerified && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="default" className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {showLabels && 'Verified'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Credentials verified by independent third-party</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Sponsorship Badge - MUST be disclosed */}
        {sponsorshipType && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="border-orange-500 text-orange-700 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {showLabels && 'Promoted'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a paid {sponsorshipType} listing</p>
              <p className="text-xs text-muted-foreground">Disclosed for transparency</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Insurance Accepted Badge */}
        {insuranceAccepted && insuranceAccepted.length > 0 && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {showLabels && `${insuranceAccepted.length} Insurances`}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium mb-1">Accepts Insurance:</p>
              <ul className="text-xs space-y-1">
                {insuranceAccepted.slice(0, 5).map((insurance, i) => (
                  <li key={i}>• {insurance}</li>
                ))}
                {insuranceAccepted.length > 5 && (
                  <li>+ {insuranceAccepted.length - 5} more</li>
                )}
              </ul>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Audit Certified Badge */}
        {auditCertified && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="border-blue-500 text-blue-700 flex items-center gap-1">
                <Award className="h-3 w-3" />
                {showLabels && 'Audit Certified'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Third-party audit attestation available</p>
              <p className="text-xs text-muted-foreground">Click specialist profile to view</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
