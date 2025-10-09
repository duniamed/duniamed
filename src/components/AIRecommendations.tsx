import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .order('score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      // Get user activity - example: recent appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('specialist_id, consultation_type, scheduled_at')
        .order('scheduled_at', { ascending: false })
        .limit(5);

      const { data, error } = await supabase.functions.invoke('ai-recommend', {
        body: {
          userActivity: appointments || [],
          context: 'medical_recommendations'
        }
      });

      if (error) throw error;

      toast({
        title: "Recommendations Generated",
        description: `Generated ${data.recommendations?.length || 0} personalized recommendations`,
      });

      await loadRecommendations();
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">AI Recommendations</h2>
        </div>
        <Button onClick={generateRecommendations} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate New'
          )}
        </Button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">No recommendations yet</p>
          <Button onClick={generateRecommendations} disabled={loading}>
            Generate Recommendations
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {rec.item_type}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">
                    Score: {rec.score}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{rec.reason}</p>
              {rec.metadata?.context && (
                <p className="text-xs text-muted-foreground mt-2">
                  Context: {rec.metadata.context}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}