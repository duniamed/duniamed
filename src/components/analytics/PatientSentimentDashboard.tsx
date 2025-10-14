import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smile, Meh, Frown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const PatientSentimentDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-sentiment-analysis', {
        body: { 
          patientId: 'patient_123',
          feedback: 'Recent patient feedback text',
          reviews: []
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "Patient sentiment analyzed successfully"
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch(sentiment) {
      case 'positive': return <Smile className="h-8 w-8 text-green-500" />;
      case 'negative': return <Frown className="h-8 w-8 text-red-500" />;
      default: return <Meh className="h-8 w-8 text-yellow-500" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Patient Sentiment Analysis</h2>
        <Button onClick={handleAnalyze} disabled={loading}>
          Analyze Sentiment
        </Button>
      </div>

      {analysis && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {getSentimentIcon(analysis.sentiment)}
            <div>
              <div className="text-2xl font-bold capitalize">{analysis.sentiment}</div>
              <div className="text-sm text-muted-foreground">
                Score: {(analysis.score * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {analysis.key_themes && analysis.key_themes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Key Themes</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.key_themes.map((theme: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.action_items && analysis.action_items.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Action Items</h3>
              <ul className="space-y-2">
                {analysis.action_items.map((item: string, idx: number) => (
                  <li key={idx} className="text-sm p-2 bg-muted rounded">• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
