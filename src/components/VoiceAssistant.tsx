import { useState } from 'react';
import { Mic, MicOff, PhoneCall, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useConversation } from '@11labs/react';

interface VoiceAssistantProps {
  sessionType?: string;
  onTranscript?: (transcript: string) => void;
}

export const VoiceAssistant = ({ sessionType = 'support', onTranscript }: VoiceAssistantProps) => {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Voice assistant connected');
      setIsActive(true);
    },
    onDisconnect: () => {
      console.log('Voice assistant disconnected');
      setIsActive(false);
    },
    onMessage: (message) => {
      console.log('Message:', message);
      if (typeof message === 'string') {
        onTranscript?.(message);
      }
    },
    onError: (error) => {
      console.error('Voice error:', error);
      toast({
        title: "Voice Error",
        description: "Failed to connect to voice assistant",
        variant: "destructive"
      });
    }
  });

  const startSession = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('voice-assistant', {
        body: { action: 'start', sessionType }
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      await conversation.startSession({ signedUrl: data.signedUrl });

      toast({
        title: "Voice Assistant Active",
        description: "Speak naturally - I'm listening!",
      });
    } catch (error: any) {
      console.error('Start error:', error);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const endSession = async () => {
    try {
      await conversation.endSession();
      
      if (sessionId) {
        await supabase.functions.invoke('voice-assistant', {
          body: { 
            action: 'end', 
            sessionId,
            transcript: [],
            durationSeconds: 0
          }
        });
      }

      setIsActive(false);
      setSessionId(null);
      
      toast({
        title: "Session Ended",
        description: "Voice assistant session closed"
      });
    } catch (error: any) {
      console.error('End error:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    conversation.setVolume({ volume: isMuted ? 1 : 0 });
  };

  return (
    <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Voice Assistant</h3>
          <p className="text-sm text-muted-foreground">
            {isActive ? 'Listening...' : 'Click to activate'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {isActive && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              className="rounded-full"
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          
          <Button
            variant={isActive ? "destructive" : "default"}
            size="icon"
            onClick={isActive ? endSession : startSession}
            className="rounded-full w-14 h-14"
          >
            {isActive ? (
              <PhoneOff className="h-6 w-6" />
            ) : (
              <PhoneCall className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {isActive && (
        <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-foreground">Recording</span>
          </div>
        </div>
      )}
    </Card>
  );
};
