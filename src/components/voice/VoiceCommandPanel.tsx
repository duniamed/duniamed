import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mic, Square } from 'lucide-react';

export const VoiceCommandPanel = () => {
  const [listening, setListening] = useState(false);
  const { toast } = useToast();

  const startVoiceCommand = async () => {
    setListening(true);
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';

      recognition.onresult = async (event: any) => {
        const command = event.results[0][0].transcript;
        
        const { data, error } = await supabase.functions.invoke('voice-navigation-command', {
          body: { voiceCommand: command }
        });

        if (error) throw error;
        
        if (data.route) {
          window.location.href = data.route;
          toast({ title: 'Navigating...', description: `Going to ${data.route}` });
        }
      };

      recognition.start();
      
      recognition.onend = () => setListening(false);
    } catch (error: any) {
      toast({ title: 'Voice command failed', description: error.message, variant: 'destructive' });
      setListening(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Navigation</CardTitle>
        <CardDescription>Use voice commands to navigate</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={listening ? () => setListening(false) : startVoiceCommand}
          variant={listening ? 'destructive' : 'default'}
          className="w-full"
        >
          {listening ? (
            <>
              <Square className="mr-2 h-4 w-4" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Start Voice Command
            </>
          )}
        </Button>
        {listening && (
          <p className="text-sm text-muted-foreground mt-2 text-center animate-pulse">
            Listening for command...
          </p>
        )}
      </CardContent>
    </Card>
  );
};
