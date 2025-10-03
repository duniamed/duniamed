import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, ArrowDown, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppMessage {
  id: string;
  phone_number: string;
  direction: string;
  status: string;
  message_body: string;
  media_urls: any;
  created_at: string;
}

export default function WhatsAppManager() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('whatsapp-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages'
      }, (payload) => {
        setMessages(prev => [payload.new as WhatsAppMessage, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error('Failed to load WhatsApp messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Note: Actual sending would be done via Twilio edge function
      toast.info('WhatsApp message would be sent via Twilio');
      setNewMessage('');
    } catch (error: any) {
      toast.error('Failed to send message: ' + error.message);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="w-8 h-8" />
            WhatsApp Messages
          </h1>
          <p className="text-muted-foreground">Two-way WhatsApp communication via Twilio</p>
        </div>
      </div>

      <Card className="p-4 mb-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>

      <ScrollArea className="h-[500px]">
        <div className="space-y-2">
          {messages.map((msg) => (
            <Card 
              key={msg.id} 
              className={`p-3 ${msg.direction === 'outbound' ? 'ml-12 bg-primary/10' : 'mr-12'}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  {msg.direction === 'inbound' ? (
                    <ArrowDown className="w-4 h-4 text-blue-500" />
                  ) : (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-sm font-medium">{msg.phone_number}</span>
                </div>
                <Badge variant="outline" className="text-xs">{msg.status}</Badge>
              </div>
              
              <p className="text-sm mb-1">{msg.message_body}</p>
              
              {msg.media_urls && Array.isArray(msg.media_urls) && msg.media_urls.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {msg.media_urls.map((url: string, idx: number) => (
                    <Badge key={idx} variant="secondary">Media {idx + 1}</Badge>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
