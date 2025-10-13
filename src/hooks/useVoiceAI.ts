// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface VoiceAIConfig {
  sessionType: 'soap_note' | 'icd_suggestion' | 'patient_query' | 'task_creation' | 'general';
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export const useVoiceAI = (config: VoiceAIConfig) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = config.continuous ?? true;
      recognitionRef.current.interimResults = config.interimResults ?? true;
      recognitionRef.current.lang = config.language || 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        // Auto-process final results
        if (finalTranscript && config.sessionType !== 'general') {
          processVoiceInput(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Voice recognition error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive"
        });
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening && config.continuous) {
          // Restart if continuous mode
          recognitionRef.current?.start();
        } else {
          setIsListening(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [config]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setAiResponse(null);
      recognitionRef.current.start();
      setIsListening(true);
      
      toast({
        title: "Voice AI activated",
        description: "Listening... Speak naturally."
      });
    }
  }, [isListening, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const processVoiceInput = useCallback(async (text: string) => {
    setIsProcessing(true);
    
    try {
      // Call unlimited edge function for AI processing
      const { data, error } = await supabase.functions.invoke('process-voice-ai', {
        body: {
          transcript: text,
          sessionType: config.sessionType,
          context: {
            timestamp: new Date().toISOString(),
            language: config.language
          }
        }
      });

      if (error) throw error;

      setAiResponse(data);

      // Store session in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('voice_ai_sessions').insert({
          user_id: user.id,
          session_type: config.sessionType,
          transcript: text,
          ai_response: data,
          context: {
            language: config.language,
            processed_at: new Date().toISOString()
          }
        });
      }

      return data;
    } catch (error: any) {
      console.error('Voice AI processing error:', error);
      toast({
        title: "Processing error",
        description: error.message || "Failed to process voice input",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [config, toast]);

  const manualProcess = useCallback(async (text?: string) => {
    const textToProcess = text || transcript;
    if (!textToProcess) {
      toast({
        title: "No input",
        description: "Please provide text or record voice first",
        variant: "destructive"
      });
      return;
    }
    
    return await processVoiceInput(textToProcess);
  }, [transcript, processVoiceInput, toast]);

  return {
    isListening,
    transcript,
    aiResponse,
    isProcessing,
    startListening,
    stopListening,
    manualProcess,
    setTranscript
  };
};
