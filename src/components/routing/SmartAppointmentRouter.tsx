import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Route, Star, Clock } from 'lucide-react';

export default function SmartAppointmentRouter() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [routing, setRouting] = useState<any>(null);

  const handleRoute = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-appointment-routing', {
        body: {
          patient_id: 'patient-123',
          symptoms,
          urgency: 'medium',
          preferences: { preferred_language: 'en', insurance: 'PPO' }
        }
      });

      if (error) throw error;

      setRouting(data.routing);
      toast({
        title: "Routing Complete",
        description: `Match score: ${data.routing.routing_score}/100`,
      });
    } catch (error: any) {
      toast({
        title: "Routing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Route className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Smart Appointment Router</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Describe Symptoms</label>
            <Input
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Enter patient symptoms..."
              className="min-h-[80px]"
            />
          </div>

          <Button onClick={handleRoute} disabled={loading || !symptoms}>
            Find Best Match
          </Button>
        </div>
      </Card>

      {routing && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Recommended Match</h4>
            <Badge>{routing.routing_score}/100 Match</Badge>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Specialist ID:</span>
              <p className="font-mono text-sm">{routing.recommended_specialist_id}</p>
            </div>

            <div>
              <span className="text-sm text-muted-foreground">Reasoning:</span>
              <p className="text-sm">{routing.reasoning}</p>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Expected wait: {routing.expected_wait_time_minutes} minutes
              </span>
            </div>

            {routing.optimal_time_slot && (
              <div className="p-3 bg-secondary rounded">
                <span className="text-sm font-medium">Optimal Time Slot:</span>
                <p className="text-sm">{routing.optimal_time_slot}</p>
              </div>
            )}

            {routing.alternative_specialists?.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Alternative Options:</h5>
                <div className="space-y-2">
                  {routing.alternative_specialists.map((alt: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-secondary rounded">
                      <span className="text-sm font-mono">{alt.specialist_id}</span>
                      <Badge variant="outline">{alt.score}/100</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
