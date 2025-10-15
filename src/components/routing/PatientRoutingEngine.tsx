import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Route, Star, Clock } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface PatientRoutingEngineProps {
  patientData: any;
  symptoms: string[];
  urgency: string;
}

export const PatientRoutingEngine = ({ patientData, symptoms, urgency }: PatientRoutingEngineProps) => {
  const [routing, setRouting] = useState(false);
  const [matches, setMatches] = useState<any>(null);
  const { toast } = useToast();

  const findSpecialist = async () => {
    setRouting(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-routing-engine', {
        body: { 
          patientData,
          symptoms,
          urgency,
          preferences: {
            language: 'en',
            gender: null,
            insurance: 'PPO'
          }
        }
      });

      if (error) throw error;

      setMatches(data.routing);
      toast({
        title: "Specialists Found",
        description: `${data.routing.topMatches?.length} optimal matches identified`
      });
    } catch (error: any) {
      toast({
        title: "Routing Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRouting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Smart Patient Routing</h3>
        </div>
        <Button onClick={findSpecialist} disabled={routing}>
          {routing ? 'Finding...' : 'Find Specialist'}
        </Button>
      </div>

      {matches && (
        <div className="space-y-4 mt-4">
          {matches.urgencyAssessment && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Urgency: {matches.urgencyAssessment}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Top Matches</p>
            <div className="space-y-3">
              {matches.topMatches?.map((match: any, index: number) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">Match #{index + 1}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Score: {(match.matchScore * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <Badge variant={match.availability === 'immediate' ? 'default' : 'secondary'}>
                      {match.availability}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span>{match.estimatedWaitTime}</span>
                  </div>
                  <p className="text-sm">{match.reasoning}</p>
                </Card>
              ))}
            </div>
          </div>

          {matches.alternativeOptions?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Alternative Options</p>
              <ul className="space-y-1">
                {matches.alternativeOptions.map((option: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">• {option}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
