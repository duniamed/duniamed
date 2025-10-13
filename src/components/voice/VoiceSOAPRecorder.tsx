// UNLIMITED EDGE FUNCTION CAPACITIES: Voice SOAP Note Recorder
// Core Principle: No typing - Real-time voice to structured notes

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceSOAPRecorderProps {
  appointmentId: string;
  specialistId: string;
  patientId: string;
  onSOAPUpdate: (soap: any) => void;
}

export function VoiceSOAPRecorder({ appointmentId, specialistId, patientId, onSOAPUpdate }: VoiceSOAPRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [soapNote, setSOAPNote] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [transcript, setTranscript] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const ws = new WebSocket(`wss://knybxihimqrqwzkdeaio.supabase.co/functions/v1/voice-to-soap-realtime`);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
          type: 'init_session',
          appointmentId,
          specialistId,
          patientId
        }));

        // Start audio capture
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 24000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        streamRef.current = stream;

        const audioContext = new AudioContext({ sampleRate: 24000 });
        audioContextRef.current = audioContext;
        
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16Data = new Int16Array(inputData.length);
            
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
            ws.send(JSON.stringify({
              type: 'audio_data',
              audio: base64Audio
            }));
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        setIsRecording(true);
        toast.success('Recording started - speak naturally');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'transcription') {
          setTranscript(prev => prev + ' ' + data.text);
        } else if (data.type === 'soap_update') {
          setSOAPNote(data.soap);
          onSOAPUpdate(data.soap);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error');
      };

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'end_session' }));
      wsRef.current.close();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsRecording(false);
    toast.success('Recording stopped');
  };

  useEffect(() => {
    return () => {
      if (isRecording) stopRecording();
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Voice SOAP Documentation</h3>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? 'destructive' : 'default'}
            size="lg"
          >
            {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </div>

        {transcript && (
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Live Transcription:</p>
            <p className="text-sm">{transcript}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Subjective</label>
            <div className="mt-1 p-3 bg-muted rounded-md min-h-[100px]">
              <p className="text-sm">{soapNote.subjective || 'Listening...'}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Objective</label>
            <div className="mt-1 p-3 bg-muted rounded-md min-h-[100px]">
              <p className="text-sm">{soapNote.objective || 'Listening...'}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Assessment</label>
            <div className="mt-1 p-3 bg-muted rounded-md min-h-[100px]">
              <p className="text-sm">{soapNote.assessment || 'Listening...'}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Plan</label>
            <div className="mt-1 p-3 bg-muted rounded-md min-h-[100px]">
              <p className="text-sm">{soapNote.plan || 'Listening...'}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}