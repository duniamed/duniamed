import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Star } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface MultiClinicRouterProps {
  patientLocation: string;
  specialty: string;
  urgency: 'low' | 'medium' | 'high';
}

export const MultiClinicRouter = ({ patientLocation, specialty, urgency }: MultiClinicRouterProps) => {
  const [loading, setLoading] = useState(false);
  const [routing, setRouting] = useState<any>(null);
  const { toast } = useToast();

  const findOptimalClinic = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-clinic-routing', {
        body: { 
          patientLocation, 
          specialty, 
          urgency,
          insuranceNetwork: 'PPO'
        }
      });

      if (error) throw error;

      setRouting(data.routing);
      toast({
        title: "Routing Complete",
        description: `Found ${data.routing.recommendedClinics?.length} optimal clinics`
      });
    } catch (error: any) {
      toast({
        title: "Routing Failed",
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
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Smart Multi-Clinic Routing</h3>
        </div>
        <Button onClick={findOptimalClinic} disabled={loading}>
          {loading ? 'Routing...' : 'Find Optimal Clinic'}
        </Button>
      </div>

      {routing && (
        <div className="space-y-4 mt-4">
          <h4 className="font-medium">Recommended Clinics</h4>
          {routing.recommendedClinics?.map((clinic: any, index: number) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">Clinic {index + 1}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Match Score: {(clinic.score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <Badge variant={clinic.availability === 'immediate' ? 'default' : 'secondary'}>
                  {clinic.availability}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span>{clinic.travelTime} travel time</span>
              </div>
              <p className="text-sm">{clinic.reasoning}</p>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};
