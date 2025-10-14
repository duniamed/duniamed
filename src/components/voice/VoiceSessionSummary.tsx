import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Clock } from 'lucide-react';

export default function VoiceSessionSummary() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const handleGenerateSummary = async () => {
    setLoading(true);
    try {
      const transcript = "Patient reports fever and cough for 3 days..."; // Mock transcript
      
      const { data, error } = await supabase.functions.invoke('voice-session-summary', {
        body: { 
          session_transcript: transcript,
          patient_id: 'patient-123'
        }
      });

      if (error) throw error;

      setSummary(data.summary);
      toast({
        title: "Summary Generated",
        description: "Voice session summary has been created",
      });
    } catch (error: any) {
      toast({
        title: "Summary Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Voice Session Summary</h3>
        </div>
        
        <Button onClick={handleGenerateSummary} disabled={loading}>
          Generate Summary
        </Button>
      </Card>

      {summary && (
        <Card className="p-6 space-y-4">
          <div>
            <h4 className="font-medium mb-2">Chief Complaint</h4>
            <p className="text-sm text-muted-foreground">{summary.chief_complaint}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Symptoms</h4>
            <div className="flex flex-wrap gap-2">
              {summary.symptoms?.map((symptom: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-secondary text-xs rounded">
                  {symptom}
                </span>
              ))}
            </div>
          </div>

          {summary.diagnoses && (
            <div>
              <h4 className="font-medium mb-2">Diagnoses</h4>
              <p className="text-sm text-muted-foreground">{summary.diagnoses}</p>
            </div>
          )}

          {summary.prescriptions && (
            <div>
              <h4 className="font-medium mb-2">Prescriptions</h4>
              <p className="text-sm text-muted-foreground">{summary.prescriptions}</p>
            </div>
          )}

          {summary.follow_up && (
            <div>
              <h4 className="font-medium mb-2">Follow-Up Plan</h4>
              <p className="text-sm text-muted-foreground">{summary.follow_up}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Duration: {summary.duration_minutes} minutes</span>
          </div>
        </Card>
      )}
    </div>
  );
}
