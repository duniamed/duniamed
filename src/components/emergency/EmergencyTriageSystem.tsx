import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Clock, Activity } from 'lucide-react';
import { toast } from 'sonner';

export const EmergencyTriageSystem = ({ patientId }: { patientId: string }) => {
  const [loading, setLoading] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [triage, setTriage] = useState<any>(null);

  const performTriage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('emergency-triage-optimizer', {
        body: {
          patientId,
          symptoms,
          vitalSigns: { bp: '140/90', hr: 110, temp: 38.5, spo2: 94 },
          medicalHistory: []
        }
      });

      if (error) throw error;
      setTriage(data.triage);
      toast.success('Triage assessment complete');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTriageLevelColor = (level: number) => {
    if (level === 1) return 'text-destructive';
    if (level === 2) return 'text-orange-500';
    if (level === 3) return 'text-yellow-500';
    return 'text-success';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Emergency Triage System (ESI)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter patient symptoms..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={3}
        />

        <Button onClick={performTriage} disabled={loading || !symptoms} className="w-full">
          {loading ? 'Assessing...' : 'Perform Triage Assessment'}
        </Button>

        {triage && (
          <div className="space-y-4">
            <div className="p-4 border-2 rounded-lg space-y-2">
              <div className="text-sm text-muted-foreground">ESI Triage Level</div>
              <div className={`text-4xl font-bold ${getTriageLevelColor(triage.triageLevel)}`}>
                Level {triage.triageLevel}
              </div>
              <div className="text-sm font-medium">{triage.acuity}</div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4" />
              <div>
                <div className="text-sm font-medium">Estimated Wait Time</div>
                <div className="text-sm text-muted-foreground">{triage.estimatedWaitTime} minutes</div>
              </div>
            </div>

            {triage.redFlags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Red Flags / Critical Findings
                </h4>
                <ul className="text-sm space-y-1">
                  {triage.redFlags.map((flag: string, idx: number) => (
                    <li key={idx} className="text-destructive font-medium">⚠️ {flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {triage.immediateInterventions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Immediate Interventions Required</h4>
                <ul className="text-sm space-y-1">
                  {triage.immediateInterventions.map((intervention: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">• {intervention}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Required Resources</h4>
              <ul className="text-sm space-y-1">
                {triage.requiredResources.map((resource: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {resource}</li>
                ))}
              </ul>
            </div>

            {triage.specialtyConsult && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">Specialty Consult</div>
                <div className="text-sm text-muted-foreground">{triage.specialtyConsult}</div>
              </div>
            )}

            {triage.safetyPrecautions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Safety Precautions</h4>
                <ul className="text-sm space-y-1">
                  {triage.safetyPrecautions.map((precaution: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">• {precaution}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Disposition</div>
                <div className="font-medium">{triage.dispositionRecommendation}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Reassess in</div>
                <div className="font-medium">{triage.reassessmentInterval} minutes</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
