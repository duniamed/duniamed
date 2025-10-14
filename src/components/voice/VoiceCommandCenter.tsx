import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Settings } from 'lucide-react';
import { VoiceNavigationButton } from './VoiceNavigationButton';
import { useToast } from '@/hooks/use-toast';

export const VoiceCommandCenter: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();

  const toggleVoiceAssistant = () => {
    if (!isEnabled) {
      // Request microphone permission
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          setIsEnabled(true);
          toast({
            title: "Voice Assistant Enabled",
            description: "You can now use voice commands to navigate and document",
          });
        })
        .catch(() => {
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access to use voice features",
            variant: "destructive"
          });
        });
    } else {
      setIsEnabled(false);
      toast({
        title: "Voice Assistant Disabled",
        description: "Voice commands are now inactive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Command Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Voice Assistant</p>
            <p className="text-sm text-muted-foreground">
              {isEnabled ? 'Active - Listening for commands' : 'Inactive'}
            </p>
          </div>
          <Button
            variant={isEnabled ? 'default' : 'outline'}
            onClick={toggleVoiceAssistant}
          >
            {isEnabled ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
            {isEnabled ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {isEnabled && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Microphone</p>
                <p className="text-sm text-muted-foreground">
                  {isMuted ? 'Muted' : 'Active'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsMuted(!isMuted)}
              >
                <Volume2 className="mr-2 h-4 w-4" />
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-sm">Available Commands:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• "Go to dashboard" - Navigate to dashboard</p>
                <p>• "Show my patients" - Open patient list</p>
                <p>• "Create appointment" - Start booking</p>
                <p>• "Add task for [patient]" - Create work queue item</p>
                <p>• "Start SOAP note" - Begin voice documentation</p>
                <p>• "Show earnings" - View earnings overview</p>
              </div>
            </div>

            <div className="flex gap-2">
              <VoiceNavigationButton />
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Privacy Protected:</strong> Voice commands are processed securely
            and never stored permanently. Only necessary clinical data is saved.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
