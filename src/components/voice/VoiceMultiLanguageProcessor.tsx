import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages, Mic } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface VoiceMultiLanguageProcessorProps {
  sourceLanguage?: string;
  targetLanguages: string[];
}

export const VoiceMultiLanguageProcessor = ({ 
  sourceLanguage = 'en', 
  targetLanguages 
}: VoiceMultiLanguageProcessorProps) => {
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const processVoice = async () => {
    setRecording(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-multi-language-processor', {
        body: { 
          audioData: 'sample_audio', 
          sourceLanguage, 
          targetLanguages 
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Voice Processed",
        description: `Detected: ${data.detectedLanguage} | Confidence: ${(data.confidence * 100).toFixed(0)}%`
      });
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRecording(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Multi-Language Voice Processor</h3>
        </div>
        <Button onClick={processVoice} disabled={recording}>
          <Mic className={`h-4 w-4 mr-2 ${recording ? 'animate-pulse' : ''}`} />
          {recording ? 'Processing...' : 'Start Voice Input'}
        </Button>
      </div>

      {result && (
        <div className="space-y-4 mt-4">
          <div>
            <p className="text-sm font-medium mb-2">Transcription</p>
            <p className="text-sm text-muted-foreground">{result.transcription}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Translations</p>
            <div className="space-y-2">
              {Object.entries(result.translations || {}).map(([lang, text]: [string, any]) => (
                <div key={lang} className="flex items-start gap-2">
                  <Badge variant="outline">{lang.toUpperCase()}</Badge>
                  <p className="text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {result.medicalTerms?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Medical Terms Detected</p>
              <div className="flex flex-wrap gap-2">
                {result.medicalTerms.map((term: string) => (
                  <Badge key={term} variant="secondary">{term}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
