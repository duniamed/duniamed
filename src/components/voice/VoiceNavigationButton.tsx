import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const VoiceNavigationButton: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Voice navigation not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      toast({
        title: "Listening",
        description: "Speak your navigation command",
      });
    };

    recognitionInstance.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('Voice command:', transcript);

      try {
        const { data, error } = await supabase.functions.invoke('voice-navigation-command', {
          body: { voiceCommand: transcript }
        });

        if (error) throw error;

        if (data.route) {
          navigate(data.route);
          toast({
            title: "Navigating",
            description: `Going to ${data.route}`,
          });
        }
      } catch (error: any) {
        toast({
          title: "Navigation Error",
          description: error.message,
          variant: "destructive"
        });
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    recognitionInstance.start();
    setRecognition(recognitionInstance);
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={isListening ? stopListening : startListening}
      className={isListening ? 'bg-primary text-white' : ''}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
};
