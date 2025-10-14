import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export const SymptomCheckerIntegration: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "Error",
        description: "Please describe your symptoms",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const lovableApiKey = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a medical symptom analyzer. Analyze symptoms and provide:
- Possible conditions
- Urgency level (low/medium/high)
- Recommended action
- Disclaimer

Return JSON format.`
            },
            {
              role: 'user',
              content: `Analyze these symptoms: ${symptoms}`
            }
          ]
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      setAnalysis(result);

      toast({
        title: "Analysis Complete",
        description: "Review the recommendations below",
      });

    } catch (error: any) {
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Symptom Checker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe your symptoms in detail..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={5}
          />

          <Button onClick={analyzeSymptoms} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Symptoms'
            )}
          </Button>

          {analysis && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-2">
                {analysis.urgency === 'high' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <Badge variant={analysis.urgency === 'high' ? 'destructive' : 'default'}>
                  {analysis.urgency} urgency
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Possible Conditions:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.conditions?.map((condition: string, i: number) => (
                    <li key={i}>{condition}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Recommended Action:</h3>
                <p>{analysis.recommendation}</p>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                {analysis.disclaimer || 'This is not a medical diagnosis. Please consult with a healthcare professional.'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
