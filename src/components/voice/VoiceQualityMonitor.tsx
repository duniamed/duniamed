import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, AlertCircle, CheckCircle } from 'lucide-react';

export default function VoiceQualityMonitor() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [qualityReport, setQualityReport] = useState<any>(null);

  const handleCheckQuality = async (audioText: string, confidence: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-quality-check', {
        body: { audio_text: audioText, confidence_score: confidence }
      });

      if (error) throw error;

      setQualityReport(data.quality_analysis);
      toast({
        title: "Quality Check Complete",
        description: `Quality score: ${data.quality_analysis.quality_score}/100`,
      });
    } catch (error: any) {
      toast({
        title: "Quality Check Failed",
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
          <Mic className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Voice Quality Monitor</h3>
        </div>
        
        <Button 
          onClick={() => handleCheckQuality("Sample audio transcription", 0.85)}
          disabled={loading}
        >
          Check Voice Quality
        </Button>
      </Card>

      {qualityReport && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Quality Score</span>
              <Badge variant={qualityReport.quality_score > 70 ? "default" : "destructive"}>
                {qualityReport.quality_score}/100
              </Badge>
            </div>

            {qualityReport.clarity_issues?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  Clarity Issues
                </h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {qualityReport.clarity_issues.map((issue: string, idx: number) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {qualityReport.suggested_clarifications?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Suggested Clarifications</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {qualityReport.suggested_clarifications.map((question: string, idx: number) => (
                    <li key={idx}>{question}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2">
              {qualityReport.is_complete ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning" />
              )}
              <span className="text-sm">
                {qualityReport.is_complete ? 'Input is medically complete' : 'Additional information needed'}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
