import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, DollarSign, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface ClinicalPathwayOptimizerProps {
  patientId: string;
  diagnosis: string;
  currentPathway: any[];
}

export function ClinicalPathwayOptimizer({ patientId, diagnosis, currentPathway }: ClinicalPathwayOptimizerProps) {
  const [optimization, setOptimization] = useState<any>(null);

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('clinical-pathway-optimizer', {
        body: { patientId, diagnosis, currentPathway }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setOptimization(data.optimization);
      toast.success("Pathway optimized successfully");
    },
    onError: () => {
      toast.error("Failed to optimize pathway");
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Clinical Pathway Optimizer
        </CardTitle>
        <CardDescription>
          AI-powered pathway optimization based on historical outcomes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!optimization ? (
          <Button 
            onClick={() => optimizeMutation.mutate()}
            disabled={optimizeMutation.isPending}
            className="w-full"
          >
            {optimizeMutation.isPending ? "Optimizing..." : "Optimize Pathway"}
          </Button>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Cost Savings</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${optimization.costSavings?.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Time Reduction</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {optimization.timeReduction}%
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Quality</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  +{optimization.qualityImprovement}%
                </p>
              </div>
            </div>

            {optimization.optimizedPathway?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Optimized Steps</h4>
                <div className="space-y-2">
                  {optimization.optimizedPathway.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Badge variant="outline">{i + 1}</Badge>
                      <span className="text-sm flex-1">{step.name}</span>
                      {step.isNew && <Badge variant="secondary">New</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={() => setOptimization(null)}
              className="w-full"
            >
              Run New Optimization
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
