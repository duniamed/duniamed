import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoiceSOAPRecorderProps {
  appointmentId: string;
  onTranscriptionComplete: (transcription: string, soapData: any) => void;
}

export function VoiceSOAPRecorder({ appointmentId, onTranscriptionComplete }: VoiceSOAPRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTranscription(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Recognition Error",
          description: event.error,
          variant: "destructive"
        });
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    try {
      setTranscription('');
      recognitionRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Speak clearly during the consultation",
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording Failed",
        description: "Unable to start speech recognition",
        variant: "destructive"
      });
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Process the transcription
      if (transcription.trim()) {
        await processTranscription(transcription);
      }
    }
  };

  const processTranscription = async (text: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-to-soap-realtime', {
        body: {
          transcriptionText: text,
          appointmentId
        }
      });

      if (error) throw error;

      if (data?.success) {
        onTranscriptionComplete(data.transcription, data.soap);
        toast({
          title: "SOAP Note Generated",
          description: "Review and edit the auto-populated fields",
        });
      }
    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Unable to generate SOAP note",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Voice Recording</h3>
            <p className="text-sm text-muted-foreground">
              Record consultation to auto-generate SOAP note
            </p>
          </div>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-2" />
              Recording: {formatTime(recordingTime)}
            </Badge>
          )}
        </div>

        <div className="flex gap-3">
          {!isRecording && !isProcessing && (
            <Button
              onClick={startRecording}
              size="lg"
              className="flex-1"
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button
              onClick={stopRecording}
              size="lg"
              variant="destructive"
              className="flex-1"
            >
              <Square className="mr-2 h-5 w-5" />
              Stop Recording
            </Button>
          )}

          {isProcessing && (
            <Button
              disabled
              size="lg"
              className="flex-1"
            >
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing Audio...
            </Button>
          )}
        </div>

        {transcription && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Transcription:</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {transcription}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          💡 Tip: Speak clearly and mention key details like symptoms, findings, and treatment plans
        </p>
      </CardContent>
    </Card>
  );
}