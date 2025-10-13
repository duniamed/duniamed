import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ICD10Suggestion {
  code: string;
  description: string;
  confidence: number;
  reasoning: string;
}

interface LiveICD10SuggestionsProps {
  soapText: string;
  symptoms?: any;
  chiefComplaint?: string;
  onAddCode?: (code: string, description: string) => void;
  addedCodes?: string[];
}

export function LiveICD10Suggestions({
  soapText,
  symptoms,
  chiefComplaint,
  onAddCode,
  addedCodes = []
}: LiveICD10SuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ICD10Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Debounce suggestions - only fetch when user stops typing for 3 seconds
    const timer = setTimeout(() => {
      if (soapText.length > 50 || chiefComplaint) {
        fetchSuggestions();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [soapText, symptoms, chiefComplaint]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-icd-suggester', {
        body: {
          soapText,
          symptoms,
          chiefComplaint
        }
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error: any) {
      console.error('Failed to fetch ICD-10 suggestions:', error);
      if (error.message?.includes('Rate limit') || error.message?.includes('quota')) {
        toast({
          variant: 'destructive',
          title: 'AI Limit Reached',
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return { variant: 'default' as const, label: 'High Confidence' };
    if (confidence >= 0.7) return { variant: 'secondary' as const, label: 'Probable' };
    return { variant: 'outline' as const, label: 'Possible' };
  };

  if (!soapText && !chiefComplaint) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>Start documenting the SOAP note to see ICD-10 code suggestions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI ICD-10 Suggestions
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && suggestions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>Analyzing clinical documentation...</p>
          </div>
        )}

        {!loading && suggestions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No suggestions yet. Continue documenting for ICD-10 code recommendations.</p>
          </div>
        )}

        {suggestions.map((suggestion, index) => {
          const badge = getConfidenceBadge(suggestion.confidence);
          const isAdded = addedCodes.includes(suggestion.code);

          return (
            <Card key={index} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {suggestion.code}
                      </code>
                      <Badge variant={badge.variant}>
                        {badge.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium">{suggestion.description}</p>
                    
                    <p className="text-xs text-muted-foreground">
                      {suggestion.reasoning}
                    </p>
                  </div>

                  {onAddCode && (
                    <Button
                      size="sm"
                      variant={isAdded ? "secondary" : "default"}
                      onClick={() => onAddCode(suggestion.code, suggestion.description)}
                      disabled={isAdded}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
