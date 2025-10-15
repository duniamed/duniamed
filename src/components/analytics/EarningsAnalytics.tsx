import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EarningsAnalyticsProps {
  specialistId: string;
}

export const EarningsAnalytics = ({ specialistId }: EarningsAnalyticsProps) => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  const analyzeEarnings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('earnings-analytics', {
        body: { 
          specialistId,
          period: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      setAnalytics(data.analytics);
      toast({
        title: "Analysis Complete",
        description: `Total earnings: $${data.analytics.totalEarnings.toFixed(2)}`
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
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
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Earnings Analytics</h3>
        </div>
        <Button onClick={analyzeEarnings} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Earnings'}
        </Button>
      </div>

      {analytics && (
        <div className="space-y-4 mt-4">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <p className="text-sm text-muted-foreground">Total Earnings (30 days)</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${analytics.totalEarnings.toFixed(2)}
            </p>
          </Card>

          {analytics.breakdown && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(analytics.breakdown).map(([key, value]: [string, any]) => (
                <Card key={key} className="p-3">
                  <p className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-xl font-bold">${value.toFixed(2)}</p>
                </Card>
              ))}
            </div>
          )}

          {analytics.trends?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trends
              </p>
              <ul className="space-y-1">
                {analytics.trends.map((trend: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">• {trend}</li>
                ))}
              </ul>
            </div>
          )}

          {analytics.recommendations?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Recommendations</p>
              <ul className="space-y-1">
                {analytics.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">💡 {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {analytics.forecast && (
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">30-Day Forecast</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${analytics.forecast.projected?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Confidence: {analytics.forecast.confidence || 'Medium'}
              </p>
            </Card>
          )}
        </div>
      )}
    </Card>
  );
};
