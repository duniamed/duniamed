import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Microscope, ExternalLink } from 'lucide-react';

export const ClinicalTrialMatcher = ({ patientId }: { patientId: string }) => {
  const [loading, setLoading] = useState(false);
  const [trials, setTrials] = useState<any[]>([]);
  const { toast } = useToast();

  const findTrials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clinical-trial-matching', {
        body: { 
          patientId,
          conditions: ['Type 2 Diabetes', 'Hypertension'],
          location: 'US'
        }
      });
      
      if (error) throw error;
      setTrials(data.trials || []);
      toast({ title: 'Trials found', description: `${data.trials?.length || 0} matching trials` });
    } catch (error: any) {
      toast({ title: 'Search failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Microscope className="h-5 w-5" />
          Clinical Trial Matching
        </CardTitle>
        <CardDescription>AI-powered trial matching based on patient profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={findTrials} disabled={loading} className="w-full">
          Find Matching Trials
        </Button>
        
        {trials.length > 0 && (
          <div className="space-y-3">
            {trials.map((trial, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold">{trial.title}</h4>
                  <Badge>{trial.match_score}% Match</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{trial.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{trial.phase}</Badge>
                  <Badge variant="outline">{trial.status}</Badge>
                </div>
                <Button size="sm" variant="link" className="p-0">
                  View Details <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
