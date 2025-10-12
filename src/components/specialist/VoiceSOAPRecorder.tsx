import { useState, useRef } from 'react';
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
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
        description: "Unable to access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to convert audio');
        }

        // Send to voice-to-soap function
        const { data, error } = await supabase.functions.invoke('voice-to-soap-realtime', {
          body: {
            audioBase64: base64Audio,
            appointmentId
          }
        });

        if (error) throw error;

        if (data?.success) {
          setTranscription(data.transcription);
          onTranscriptionComplete(data.transcription, data.soap);
          toast({
            title: "Transcription Complete",
            description: "SOAP note has been auto-populated",
          });
        }
      };
    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Unable to process audio",
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