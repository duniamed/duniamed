import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Volume2, Mic, Square, Settings } from 'lucide-react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';

/**
 * C6 USABILITY - Voice Assist Integration
 * 
 * WORKFLOW FOR PATIENTS:
 * 1. Navigate to voice assist settings
 * 2. Input ElevenLabs API key (stored in user preferences)
 * 3. Start voice conversation with AI assistant
 * 4. AI helps navigate the app, book appointments, ask questions
 * 5. Hands-free operation for accessibility
 * 
 * WORKFLOW FOR SPECIALISTS:
 * 1. Enable voice assist in clinic settings
 * 2. Use voice commands during patient consultations
 * 3. Dictate notes directly to SOAP note forms
 * 4. Voice-controlled navigation during busy periods
 * 
 * INTEGRATION: ElevenLabs Conversational AI
 * - Real-time voice recognition
 * - Natural language understanding
 * - Multilingual support
 * - Context-aware responses
 */

export default function VoiceAssist() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [agentId, setAgentId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  
  const conversation = useConversation({
    onConnect: () => {
      toast({
        title: "Voice assist connected",
        description: "Say 'help' to see available commands",
      });
    },
    onDisconnect: () => {
      toast({
        title: "Voice assist disconnected",
      });
    },
    onError: (error) => {
      toast({
        title: "Voice error",
        description: typeof error === 'string' ? error : 'An error occurred',
        variant: "destructive",
      });
    },
    onMessage: (message) => {
      console.log('AI message:', message);
    },
    clientTools: {
      navigateTo: (params: { page: string }) => {
        window.location.href = params.page;
        return `Navigating to ${params.page}`;
      },
      bookAppointment: (params: { specialistId: string; date: string }) => {
        window.location.href = `/book-appointment?specialist=${params.specialistId}&date=${params.date}`;
        return `Booking appointment`;
      },
      searchSpecialists: (params: { specialty: string }) => {
        window.location.href = `/search?specialty=${params.specialty}`;
        return `Searching for ${params.specialty} specialists`;
      }
    }
  });

  const handleStartConversation = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-signed-url', {
        body: { agentId, apiKey }
      });
      
      if (error) throw error;
      if (!data?.signedUrl) throw new Error('No signed URL returned');
      
      await conversation.startSession({ signedUrl: data.signedUrl });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || 'Failed to start conversation',
        variant: "destructive",
      });
    }
  };

  const handleEndConversation = async () => {
    await conversation.endSession();
  };

  const saveConfiguration = () => {
    // Save to user preferences
    localStorage.setItem('elevenlabs_config', JSON.stringify({ apiKey, agentId }));
    setIsConfigured(true);
    toast({
      title: "Configuration saved",
      description: "Voice assist is ready to use",
    });
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Volume2 className="h-8 w-8" />
            Voice Assist (C6 Usability)
          </h1>
          <p className="text-muted-foreground mt-2">
            Hands-free navigation and assistance with AI-powered voice commands
          </p>
        </div>

        {!isConfigured ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configure Voice Assist
              </CardTitle>
              <CardDescription>
                Set up ElevenLabs integration for voice assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">ElevenLabs API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk_..."
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from{' '}
                  <a href="https://elevenlabs.io/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    ElevenLabs dashboard
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentId">Agent ID</Label>
                <Input
                  id="agentId"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="agent_..."
                />
                <p className="text-sm text-muted-foreground">
                  Create a conversational AI agent in your ElevenLabs dashboard
                </p>
              </div>

              <Button onClick={saveConfiguration} disabled={!apiKey || !agentId}>
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Voice Assistant Control</CardTitle>
                <CardDescription>
                  Status: {conversation.status === 'connected' ? 'Active' : 'Ready'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  {conversation.status !== 'connected' ? (
                    <Button size="lg" onClick={handleStartConversation}>
                      <Mic className="h-5 w-5 mr-2" />
                      Start Voice Assist
                    </Button>
                  ) : (
                    <div className="text-center space-y-4">
                      {conversation.isSpeaking && (
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <Volume2 className="h-6 w-6 animate-pulse" />
                          <span>AI is speaking...</span>
                        </div>
                      )}
                      <Button size="lg" variant="destructive" onClick={handleEndConversation}>
                        <Square className="h-5 w-5 mr-2" />
                        End Conversation
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Available Voice Commands:</h3>
                  <ul className="text-sm space-y-1">
                    <li>• "Book an appointment with a cardiologist"</li>
                    <li>• "Show my medical records"</li>
                    <li>• "Find specialists near me"</li>
                    <li>• "Check my upcoming appointments"</li>
                    <li>• "Navigate to messages"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={() => setIsConfigured(false)}>
              <Settings className="h-4 w-4 mr-2" />
              Reconfigure
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
