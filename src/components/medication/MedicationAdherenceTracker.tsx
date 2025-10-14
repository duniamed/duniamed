import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Pill, TrendingUp, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function MedicationAdherenceTracker() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTrackAdherence = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('medication-adherence-tracker', {
        body: {
          patientId: 'current-user-id',
          prescriptionId: 'prescription-id',
          adherenceData: { doses_taken: 28, doses_scheduled: 30 }
        }
      });

      if (error) throw error;

      toast({
        title: "Adherence Tracked",
        description: `Score: ${data.adherenceAnalysis.adherence_score}%`
      });
    } catch (error: any) {
      toast({
        title: "Tracking Failed",
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
        <div className="flex items-center gap-3">
          <Pill className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Medication Adherence</h2>
        </div>
        <Button onClick={handleTrackAdherence} disabled={loading}>
          Log Dose
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Adherence Score</p>
              <p className="text-2xl font-bold">93%</p>
            </div>
          </div>
          <Progress value={93} className="mt-4" />
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Doses This Month</p>
              <p className="text-2xl font-bold">28/30</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Pill className="h-8 w-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Missed Doses</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
