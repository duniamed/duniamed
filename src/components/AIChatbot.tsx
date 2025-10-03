import { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showEscalation, setShowEscalation] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chatbot', {
        body: {
          sessionId,
          message: userMessage,
          action: 'chat'
        }
      });

      if (error) throw error;

      if (!sessionId) setSessionId(data.sessionId);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      }]);

      if (data.suggestEscalation) {
        setShowEscalation(true);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again or contact support.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const escalateToHuman = async () => {
    try {
      await supabase.functions.invoke('ai-chatbot', {
        body: {
          sessionId,
          action: 'escalate'
        }
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I've connected you with a human agent. They'll assist you shortly!",
        timestamp: new Date().toISOString()
      }]);
      setShowEscalation(false);
    } catch (error) {
      console.error('Escalation error:', error);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <h3 className="font-semibold text-foreground">AI Support Assistant</h3>
        <p className="text-sm text-muted-foreground">How can I help you today?</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>👋 Hi! I'm your AI assistant.</p>
              <p className="text-sm mt-2">Ask me anything about appointments, specialists, or insurance.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  🤖
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                🤖
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {showEscalation && (
        <Alert className="mx-4 mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Need more help?</span>
            <Button size="sm" onClick={escalateToHuman}>
              Talk to Human Agent
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};
