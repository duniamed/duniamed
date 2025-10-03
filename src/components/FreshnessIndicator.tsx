import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Flag } from 'lucide-react';
import { ProfileFlagDialog } from './ProfileFlagDialog';

/**
 * C11 FRESHNESS - Freshness Indicator
 * Shows last updated date and allows crowd-flagging
 */

interface FreshnessIndicatorProps {
  specialistId: string;
}

export function FreshnessIndicator({ specialistId }: FreshnessIndicatorProps) {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showFlagDialog, setShowFlagDialog] = useState(false);

  useEffect(() => {
    loadLastUpdated();
  }, [specialistId]);

  const loadLastUpdated = async () => {
    try {
      const { data } = await supabase
        .from('profile_freshness_logs')
        .select('created_at')
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setLastUpdated(data.created_at);
      }
    } catch (error) {
      console.error('Error loading freshness data:', error);
    }
  };

  const getDaysSinceUpdate = () => {
    if (!lastUpdated) return null;
    const days = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const days = getDaysSinceUpdate();
  const isStale = days !== null && days > 90;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isStale ? "destructive" : "secondary"} className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {days !== null ? `Updated ${days}d ago` : 'Recently verified'}
      </Badge>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowFlagDialog(true)}
        className="h-8 px-2"
      >
        <Flag className="h-4 w-4 mr-1" />
        Report Issue
      </Button>

      <ProfileFlagDialog
        specialistId={specialistId}
        open={showFlagDialog}
        onOpenChange={setShowFlagDialog}
      />
    </div>
  );
}