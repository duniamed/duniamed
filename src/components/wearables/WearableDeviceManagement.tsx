import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Watch, Activity, Heart, TrendingUp } from "lucide-react";

export default function WearableDeviceManagement() {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();

  const handleConnectDevice = async (provider: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('wearable-data-import', {
        body: {
          provider,
          patientId: 'current-user-id',
          accessToken: 'dummy-token',
          dataType: 'steps'
        }
      });

      if (error) throw error;

      setConnected(true);
      toast({
        title: "Device Connected",
        description: `${data.imported} data points imported`
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Watch className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-bold">Wearable Devices</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Steps Today</p>
              <p className="text-2xl font-bold">8,432</p>
            </div>
          </div>
          <Badge variant="outline">Fitbit</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Heart className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Heart Rate</p>
              <p className="text-2xl font-bold">72 bpm</p>
            </div>
          </div>
          <Badge variant="outline">Apple Watch</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Active Minutes</p>
              <p className="text-2xl font-bold">45 min</p>
            </div>
          </div>
          <Badge variant="outline">Google Fit</Badge>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Connect New Device</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Button 
            variant="outline" 
            onClick={() => handleConnectDevice('fitbit')}
            disabled={loading}
            className="justify-start"
          >
            <Watch className="mr-2 h-5 w-5" />
            Connect Fitbit
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleConnectDevice('apple_health')}
            disabled={loading}
            className="justify-start"
          >
            <Watch className="mr-2 h-5 w-5" />
            Connect Apple Health
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleConnectDevice('google_fit')}
            disabled={loading}
            className="justify-start"
          >
            <Watch className="mr-2 h-5 w-5" />
            Connect Google Fit
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleConnectDevice('withings')}
            disabled={loading}
            className="justify-start"
          >
            <Watch className="mr-2 h-5 w-5" />
            Connect Withings
          </Button>
        </div>
      </Card>

      {connected && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Sync Activity</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((_, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Daily Activity Sync</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(Date.now() - idx * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge>Synced</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
