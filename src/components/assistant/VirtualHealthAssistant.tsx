import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const VirtualHealthAssistant: React.FC<{ userId: string }> = ({ userId }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<any[]>([]);
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    const userMessage = { role: 'user', content: message };
    setConversation(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('virtual-health-assistant', {
        body: {
          userId,
          message,
          conversationHistory: conversation,
          patientContext: {}
        }
      });

      if (error) throw error;

      const assistantMessage = {
        role: 'assistant',
        content: data.assistantResponse.response,
        intent: data.assistantResponse.intent,
        urgencyLevel: data.assistantResponse.urgencyLevel
      };

      setConversation(prev => [...prev, assistantMessage]);
      setMessage('');

      if (data.assistantResponse.requiresHumanFollowup) {
        toast({
          title: 'Follow-up Required',
          description: 'This conversation requires human review'
        });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Virtual Health Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-8'
                    : 'bg-muted mr-8'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                {msg.urgencyLevel && (
                  <span className={`text-xs mt-1 inline-block px-2 py-1 rounded ${
                    msg.urgencyLevel === 'critical' ? 'bg-red-500 text-white' :
                    msg.urgencyLevel === 'high' ? 'bg-orange-500 text-white' :
                    'bg-yellow-500 text-black'
                  }`}>
                    {msg.urgencyLevel}
                  </span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything about your health..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
