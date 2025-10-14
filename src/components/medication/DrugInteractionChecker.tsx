import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { AlertTriangle, CheckCircle, Shield } from "lucide-react";

export default function DrugInteractionChecker() {
  const [loading, setLoading] = useState(false);
  const [interactions, setInteractions] = useState<any[]>([]);
  const { toast } = useToast();

  const handleCheckInteractions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('drug-interaction-checker', {
        body: {
          medications: ['medication1', 'medication2'],
          patientConditions: ['condition1']
        }
      });

      if (error) throw error;

      setInteractions(data.interactionCheck.interactions);
      toast({
        title: "Interaction Check Complete",
        description: `Found ${data.interactionCheck.interactions.length} potential interactions`,
        variant: data.interactionCheck.safe_to_prescribe ? 'default' : 'destructive'
      });
    } catch (error: any) {
      toast({
        title: "Check Failed",
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
          <Shield className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Drug Interaction Checker</h2>
        </div>
        <Button onClick={handleCheckInteractions} disabled={loading}>
          {loading ? 'Checking...' : 'Check Interactions'}
        </Button>
      </div>

      <div className="space-y-4">
        {interactions.length === 0 ? (
          <Card className="p-6">
            <div className="flex items-center gap-3 text-success">
              <CheckCircle className="h-6 w-6" />
              <p>No drug interactions detected</p>
            </div>
          </Card>
        ) : (
          interactions.map((interaction, idx) => (
            <Card key={idx} className="p-6 border-warning">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-2">
                    {interaction.severity.toUpperCase()} Interaction
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">{interaction.description}</p>
                  <p className="text-sm font-medium">Recommendation: {interaction.recommendation}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
