import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { AlertTriangle, Brain, CheckCircle } from "lucide-react";

export default function MentalHealthScreening() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleScreening = async (assessmentType: 'PHQ-9' | 'GAD-7') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mental-health-crisis-detector', {
        body: {
          patientId: 'current-user-id',
          assessmentType,
          screeningData: { responses: [] }
        }
      });

      if (error) throw error;

      toast({
        title: "Screening Complete",
        description: `Crisis level: ${data.crisisAnalysis.crisis_level}`,
        variant: data.crisisAnalysis.immediate_action_required ? 'destructive' : 'default'
      });
    } catch (error: any) {
      toast({
        title: "Screening Failed",
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
        <Brain className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-bold">Mental Health Screening</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">PHQ-9 Depression Screening</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Patient Health Questionnaire for depression assessment
          </p>
          <Button onClick={() => handleScreening('PHQ-9')} disabled={loading} className="w-full">
            Start PHQ-9 Screening
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">GAD-7 Anxiety Screening</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generalized Anxiety Disorder assessment
          </p>
          <Button onClick={() => handleScreening('GAD-7')} disabled={loading} className="w-full">
            Start GAD-7 Screening
          </Button>
        </Card>
      </div>

      <Card className="p-6 border-destructive">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <h4 className="font-semibold mb-2">Crisis Support</h4>
            <p className="text-sm text-muted-foreground">
              If you're experiencing a mental health crisis, please contact emergency services or a crisis hotline immediately.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
