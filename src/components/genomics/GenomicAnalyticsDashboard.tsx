import { Card } from "@/components/ui/card";
import { Activity, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function GenomicAnalyticsDashboard() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCalculateRisk = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('genomic-risk-calculator', {
        body: {
          patientId: 'current-user-id',
          genomicData: { markers: [] },
          conditions: ['diabetes', 'heart_disease']
        }
      });

      if (error) throw error;

      toast({
        title: "Genomic Analysis Complete",
        description: `Risk analysis completed with ${data.riskAnalysis.risk_scores.length} conditions analyzed`
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Genomic Analytics</h2>
        <Button onClick={handleCalculateRisk} disabled={loading}>
          {loading ? 'Analyzing...' : 'Calculate Risk Scores'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Genetic Markers</p>
              <p className="text-2xl font-bold">127</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">High Risk Conditions</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Overall Health Score</p>
              <p className="text-2xl font-bold">78/100</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
