// UNLIMITED EDGE FUNCTION CAPACITIES: Voice AI Hook
// Core Principle: No typing - Voice-first interaction

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoiceCommandOptions {
  onCommand: (command: string) => void;
  sessionType?: string;
  autoStop?: boolean;
}

export function useVoiceCommand({ onCommand, sessionType = 'general', autoStop = true }: VoiceCommandOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(async () => {
    try {
      // Check browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error('Voice recognition not supported in this browser');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = !autoStop;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.success('Listening... Speak now');
      };

      recognition.onresult = async (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        if (event.results[current].isFinal) {
          // Process with AI via edge function
          try {
            const { data, error } = await supabase.functions.invoke('process-voice-ai', {
              body: { 
                transcript: transcriptText,
                sessionType,
                context: {}
              }
            });

            if (error) throw error;

            // Save session to database
            await supabase.from('voice_ai_sessions').insert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              session_type: sessionType,
              transcript: transcriptText,
              ai_response: data.response,
              confidence_score: data.confidence || 0.9,
              processed_at: new Date().toISOString(),
              metadata: { model: data.model }
            } as any);

            // Execute command
            onCommand(transcriptText);
          } catch (error) {
            console.error('Voice processing error:', error);
            toast.error('Failed to process voice command');
          }

          if (autoStop) {
            recognition.stop();
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          toast.error('No speech detected. Please try again.');
        } else {
          toast.error(`Voice recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (error) {
      console.error('Error starting voice recognition:', error);
      toast.error('Failed to start voice recognition');
      setIsListening(false);
    }
  }, [onCommand, sessionType, autoStop]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening
  };
}