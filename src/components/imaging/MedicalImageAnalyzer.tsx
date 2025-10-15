import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Image, AlertTriangle, CheckCircle2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export const MedicalImageAnalyzer = ({ patientId }: { patientId: string }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeImage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('medical-image-analysis', {
        body: {
          imageUrl,
          imageType: 'xray',
          patientId,
          clinicalContext: 'chest pain evaluation'
        }
      });

      if (error) throw error;
      setAnalysis(data.analysis);
      toast.success('Image analysis complete');
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
          <Image className="h-5 w-5" />
          Medical Image Analysis AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Image URL..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <Button onClick={analyzeImage} disabled={loading || !imageUrl} className="w-full">
            {loading ? 'Analyzing...' : 'Analyze Image'}
          </Button>
        </div>

        {analysis && (
          <div className="space-y-4">
            {analysis.requiresUrgentReview && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">Requires Urgent Review</span>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Findings</h4>
              <ul className="text-sm space-y-1">
                {analysis.findings.map((finding: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {finding}</li>
                ))}
              </ul>
            </div>

            {analysis.abnormalities.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">Abnormalities Detected</h4>
                <ul className="text-sm space-y-1">
                  {analysis.abnormalities.map((abnormality: string, idx: number) => (
                    <li key={idx} className="text-destructive">• {abnormality}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Severity:</span>
                <span className={analysis.severity === 'high' ? 'text-destructive' : ''}>{analysis.severity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">AI Confidence:</span>
                <span>{(analysis.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recommendations</h4>
              <ul className="text-sm space-y-1">
                {analysis.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {rec}</li>
                ))}
              </ul>
            </div>

            {analysis.suggestedFollowUp && (
              <div className="text-sm">
                <span className="font-medium">Follow-up: </span>
                <span className="text-muted-foreground">{analysis.suggestedFollowUp}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
