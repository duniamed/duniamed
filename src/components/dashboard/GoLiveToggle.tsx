// UNLIMITED EDGE FUNCTION CAPACITIES: Go Live Toggle Component
// Core Principle: Instant availability control

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Radio, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoLiveToggleProps {
  specialistId: string;
  clinicId?: string;
}

export function GoLiveToggle({ specialistId, clinicId }: GoLiveToggleProps) {
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    loadStatus();
    
    // Real-time updates
    const channel = supabase
      .channel('live-status-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'specialist_live_status',
        filter: `specialist_id=eq.${specialistId}`
      }, (payload) => {
        setStatus(payload.new);
        setIsLive(payload.new.is_live);
        setQueueSize(payload.new.current_queue_size || 0);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [specialistId]);

  const loadStatus = async () => {
    const { data } = await (supabase as any)
      .from('specialist_live_status')
      .select('*')
      .eq('specialist_id', specialistId)
      .maybeSingle();

    if (data) {
      setStatus(data);
      setIsLive(data.is_live);
      setQueueSize(data.current_queue_size || 0);
    }
  };

  const toggleLive = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('specialist-go-live-toggle', {
        body: {
          specialistId,
          goLive: !isLive,
          clinicId
        }
      });

      if (error) throw error;

      setIsLive(!isLive);
      setStatus(data.status);
      setQueueSize(data.queueSize || 0);

      toast.success(
        !isLive ? 'You are now LIVE for on-demand consultations' : 'You are now offline',
        { description: data.recommendation }
      );
    } catch (error: any) {
      console.error('Error toggling live status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-300'}`}>
            <Radio className={`w-6 h-6 text-white ${isLive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">On-Demand Consultations</h3>
            <p className="text-sm text-muted-foreground">
              {isLive ? 'You are available for instant consultations' : 'Currently offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLive && (
            <div className="flex gap-4 mr-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{queueSize} in queue</span>
              </div>
              {status?.fatigue_score > 0.7 && (
                <Badge variant="destructive">High Fatigue</Badge>
              )}
            </div>
          )}
          
          <Switch
            checked={isLive}
            onCheckedChange={toggleLive}
            disabled={loading}
          />
        </div>
      </div>

      {status?.auto_offline_at && isLive && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Auto-offline at {new Date(status.auto_offline_at).toLocaleTimeString()}</span>
        </div>
      )}
    </Card>
  );
}