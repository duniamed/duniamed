import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Video, Wifi, Volume2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export const QualityMonitor = ({ appointmentId }: { appointmentId: string }) => {
  const [quality, setQuality] = useState<any>(null);

  useEffect(() => {
    const monitorQuality = setInterval(async () => {
      try {
        const videoMetrics = {
          resolution: '1080p',
          frameRate: 30,
          bitrate: 2500
        };
        const audioMetrics = {
          bitrate: 128,
          sampleRate: 48000
        };

        const { data, error } = await supabase.functions.invoke('telemedicine-quality-monitor', {
          body: { appointmentId, videoMetrics, audioMetrics }
        });

        if (error) throw error;
        setQuality(data.quality);

        if (data.quality.requiresIntervention) {
          toast.error('Connection quality issues detected');
        }
      } catch (error: any) {
        console.error('Quality monitoring error:', error);
      }
    }, 5000);

    return () => clearInterval(monitorQuality);
  }, [appointmentId]);

  if (!quality) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Call Quality Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Quality
              </span>
              <span className="font-medium">{quality.videoQuality}%</span>
            </div>
            <Progress value={quality.videoQuality} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Audio Quality
              </span>
              <span className="font-medium">{quality.audioQuality}%</span>
            </div>
            <Progress value={quality.audioQuality} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Connection Stability
              </span>
              <span className="font-medium">{quality.connectionStability}%</span>
            </div>
            <Progress value={quality.connectionStability} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Latency</div>
            <div className="font-medium">{quality.latency}ms</div>
          </div>
          <div>
            <div className="text-muted-foreground">Packet Loss</div>
            <div className="font-medium">{quality.packetLoss}%</div>
          </div>
        </div>

        {quality.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Issues Detected
            </h4>
            <ul className="text-sm space-y-1">
              {quality.issues.map((issue: string, idx: number) => (
                <li key={idx} className="text-destructive">• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {quality.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recommendations</h4>
            <ul className="text-sm space-y-1">
              {quality.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="text-muted-foreground">• {rec}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium">Overall Quality Score</div>
          <div className="text-2xl font-bold">{quality.overallQuality}/100</div>
        </div>
      </CardContent>
    </Card>
  );
};
