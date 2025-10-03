import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Activity, Wifi, Phone, Video, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * C19 TELEHEALTH - Video Health Monitor
 * Pre-session checks, real-time quality monitoring, automatic fallbacks
 */

interface HealthCheck {
  connectivity: 'good' | 'fair' | 'poor';
  audioQuality: number;
  videoQuality: number;
  latency: number;
  packetLoss: number;
}

interface TelehealthIncident {
  id: string;
  incident_type: string;
  severity: string;
  description: string;
  status: string;
  created_at: string;
}

export function VideoHealthMonitor({ 
  appointmentId, 
  sessionId,
  onFallbackNeeded 
}: { 
  appointmentId: string;
  sessionId?: string;
  onFallbackNeeded?: () => void;
}) {
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [incidents, setIncidents] = useState<TelehealthIncident[]>([]);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveIncidents();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (monitoring && sessionId) {
      interval = setInterval(() => {
        performHealthCheck();
      }, 10000); // Check every 10 seconds during call
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [monitoring, sessionId]);

  const fetchActiveIncidents = async () => {
    try {
      const { data } = await (supabase as any)
        .from('telehealth_incidents')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      setIncidents((data || []) as TelehealthIncident[]);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const performHealthCheck = useCallback(async () => {
    setChecking(true);
    
    try {
      // Simulate health check (in production, use WebRTC stats API)
      const check: HealthCheck = {
        connectivity: Math.random() > 0.8 ? 'poor' : Math.random() > 0.5 ? 'fair' : 'good',
        audioQuality: Math.floor(Math.random() * 40) + 60, // 60-100
        videoQuality: Math.floor(Math.random() * 40) + 60, // 60-100
        latency: Math.floor(Math.random() * 200) + 50, // 50-250ms
        packetLoss: Math.random() * 3 // 0-3%
      };

      setHealthCheck(check);

      // Log to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any)
          .from('video_session_health')
          .insert({
            appointment_id: appointmentId,
            session_id: sessionId,
            health_status: check.connectivity === 'good' ? 'healthy' : 
                          check.connectivity === 'fair' ? 'warning' : 'critical',
            connectivity_score: check.connectivity === 'good' ? 90 : 
                               check.connectivity === 'fair' ? 60 : 30,
            audio_quality: check.audioQuality,
            video_quality: check.videoQuality,
            latency_ms: check.latency,
            packet_loss_percent: check.packetLoss
          });
      }

      // Trigger fallback if connection is poor
      if (check.connectivity === 'poor' && !fallbackTriggered) {
        handleFallback();
      }
    } catch (error) {
      console.error('Error performing health check:', error);
    } finally {
      setChecking(false);
    }
  }, [appointmentId, sessionId, fallbackTriggered]);

  const handleFallback = async () => {
    setFallbackTriggered(true);

    toast({
      title: "Connection Issues Detected",
      description: "Switching to audio-only mode to maintain call quality",
    });

    // Log fallback trigger
    await (supabase as any)
      .from('video_session_health')
      .update({
        fallback_triggered: true,
        fallback_type: 'audio_only'
      })
      .eq('appointment_id', appointmentId)
      .eq('session_id', sessionId);

    if (onFallbackNeeded) {
      onFallbackNeeded();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'fair': return 'text-amber-600';
      case 'poor': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-green-600';
    if (quality >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Active Incidents Banner */}
      {incidents.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Service disruption detected. Some features may be affected.
            <Button variant="link" className="ml-2 h-auto p-0" onClick={fetchActiveIncidents}>
              View details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Pre-Session Check */}
      {!monitoring && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Pre-Session Health Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                performHealthCheck();
                setMonitoring(true);
              }}
              className="w-full"
              disabled={checking}
            >
              {checking ? 'Running Tests...' : 'Run Connection Test'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Health Status */}
      {healthCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {healthCheck.connectivity === 'good' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Health:</span>
              <Badge 
                variant={healthCheck.connectivity === 'good' ? 'default' : 'secondary'}
                className={getStatusColor(healthCheck.connectivity)}
              >
                {healthCheck.connectivity.toUpperCase()}
              </Badge>
            </div>

            {/* Metrics */}
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    Audio Quality
                  </span>
                  <span className={getQualityColor(healthCheck.audioQuality)}>
                    {healthCheck.audioQuality}%
                  </span>
                </div>
                <Progress value={healthCheck.audioQuality} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video Quality
                  </span>
                  <span className={getQualityColor(healthCheck.videoQuality)}>
                    {healthCheck.videoQuality}%
                  </span>
                </div>
                <Progress value={healthCheck.videoQuality} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Latency</p>
                  <p className="text-lg font-semibold">{healthCheck.latency}ms</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Packet Loss</p>
                  <p className="text-lg font-semibold">{healthCheck.packetLoss.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Fallback Options */}
            {healthCheck.connectivity !== 'good' && (
              <div className="pt-4 space-y-2">
                <p className="text-sm font-medium">Recommended Actions:</p>
                <div className="space-y-2">
                  {healthCheck.connectivity === 'poor' && (
                    <Button variant="outline" className="w-full" onClick={handleFallback}>
                      <Phone className="h-4 w-4 mr-2" />
                      Switch to Audio-Only
                    </Button>
                  )}
                  <Button variant="outline" className="w-full">
                    Reschedule Appointment
                  </Button>
                </div>
              </div>
            )}

            {fallbackTriggered && (
              <Alert>
                <AlertDescription>
                  Call switched to audio-only mode for better stability
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
