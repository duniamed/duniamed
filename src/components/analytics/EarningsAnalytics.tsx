import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const EarningsAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('earnings-analytics', {
        body: { specialist_id: 'spec_123', time_period: '30d' }
      });

      if (error) throw error;

      setAnalytics(data.analytics);
    } catch (error: any) {
      toast({
        title: "Analytics Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Earnings Analytics</h3>
        </div>
        <Button onClick={fetchAnalytics} disabled={loading}>
          Load Analytics
        </Button>
      </div>
      {analytics && (
        <div className="grid gap-4">
          <div>
            <div className="text-2xl font-bold">${analytics.total_earnings}</div>
            <div className="text-sm text-muted-foreground">Total Earnings</div>
          </div>
          <div>
            <div className="text-xl">{analytics.completed_appointments}</div>
            <div className="text-sm text-muted-foreground">Completed Appointments</div>
          </div>
          <div>
            <div className="text-xl">${analytics.average_fee}</div>
            <div className="text-sm text-muted-foreground">Average Fee</div>
          </div>
        </div>
      )}
    </Card>
  );
};
