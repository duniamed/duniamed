import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Calendar } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AdvancedSchedulingOptimizer = () => {
  const [loading, setLoading] = useState(false);
  const [optimization, setOptimization] = useState<any>(null);
  const { toast } = useToast();

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('advanced-scheduling-ml', {
        body: { 
          clinicId: 'clinic_123',
          constraints: {
            staff_availability: true,
            room_capacity: true,
            patient_preferences: true
          }
        }
      });

      if (error) throw error;

      setOptimization(data.optimization);
      toast({
        title: "Schedule Optimized",
        description: "AI has generated an optimized schedule"
      });
    } catch (error: any) {
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">ML Schedule Optimizer</h2>
        </div>
        <Button onClick={handleOptimize} disabled={loading}>
          <Calendar className="h-4 w-4 mr-2" />
          Optimize Schedule
        </Button>
      </div>

      {optimization && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Efficiency Score</div>
              <div className="text-3xl font-bold text-primary">
                {(optimization.efficiency_score * 100).toFixed(0)}%
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Optimized Slots</div>
              <div className="text-3xl font-bold">{optimization.optimized_slots || 0}</div>
            </Card>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Recommendations</h3>
            <ul className="space-y-2">
              {optimization.recommendations?.map((rec: string, idx: number) => (
                <li key={idx} className="text-sm p-2 bg-muted rounded">• {rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
};
