import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Heart, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export const ChronicDiseaseManager = ({ patientId }: { patientId: string }) => {
  const [loading, setLoading] = useState(false);
  const [conditionType, setConditionType] = useState('diabetes');
  const [management, setManagement] = useState<any>(null);

  const analyzeCondition = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chronic-disease-management', {
        body: {
          patientId,
          conditionType,
          vitalSigns: { glucose: 120, bp: '130/80', weight: 180 },
          medications: []
        }
      });

      if (error) throw error;
      setManagement(data.management);
      toast.success('Analysis complete');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Chronic Disease Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select value={conditionType} onValueChange={setConditionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diabetes">Diabetes</SelectItem>
              <SelectItem value="hypertension">Hypertension</SelectItem>
              <SelectItem value="copd">COPD</SelectItem>
              <SelectItem value="heart_failure">Heart Failure</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={analyzeCondition} disabled={loading} className="w-full">
            {loading ? 'Analyzing...' : 'Analyze Condition'}
          </Button>
        </div>

        {management && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Disease Control</span>
                <span className="text-sm">{management.diseaseControl}%</span>
              </div>
              <Progress value={management.diseaseControl} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Medication Adherence</span>
                <span className="text-sm">{management.medicationAdherence}%</span>
              </div>
              <Progress value={management.medicationAdherence} />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">Trend Analysis</div>
              <div className="text-sm text-muted-foreground">{management.trendAnalysis}</div>
            </div>

            {management.alerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Alerts
                </h4>
                <ul className="text-sm space-y-1">
                  {management.alerts.map((alert: string, idx: number) => (
                    <li key={idx} className="text-destructive">• {alert}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Action Plan
              </h4>
              <ul className="text-sm space-y-1">
                {management.actionPlan.map((action: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {action}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Lifestyle Factors</h4>
              <ul className="text-sm space-y-1">
                {management.lifestyleFactors.map((factor: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {factor}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Educational Topics</h4>
              <ul className="text-sm space-y-1">
                {management.educationalTopics.map((topic: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {topic}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
