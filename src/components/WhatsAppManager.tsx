import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, ArrowDown, ArrowUp, CheckCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppMessage {
  id: string;
  phone_number: string;
  direction: string;
  status: string;
  message_body: string;
  message_sid: string;
  media_urls: any;
  created_at: string;
}

interface MessageStatus {
  message_id: string;
  status: string;
  error_code?: string;
  error_message?: string;
  updated_at: string;
}

export default function WhatsAppManager() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messageStatuses, setMessageStatuses] = useState<Map<string, MessageStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMessages();
    fetchMessageStatuses();
    
    // Subscribe to real-time message updates
    const messageChannel = supabase
      .channel('whatsapp-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages'
      }, (payload) => {
        setMessages(prev => [payload.new as WhatsAppMessage, ...prev]);
      })
      .subscribe();

    // Subscribe to delivery status updates
    const statusChannel = supabase
      .channel('message-delivery-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_delivery_status'
      }, (payload) => {
        const status = payload.new as MessageStatus;
        setMessageStatuses(prev => new Map(prev).set(status.message_id, status));
        
        // Show toast for status changes
        if (status.status === 'delivered') {
          toast.success('Message delivered');
        } else if (status.status === 'read') {
          toast.success('Message read');
        } else if (status.status === 'failed') {
          toast.error('Message failed: ' + status.error_message);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(statusChannel);
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

  const fetchMessageStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('message_delivery_status')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const statusMap = new Map<string, MessageStatus>();
      data?.forEach(status => {
        statusMap.set(status.message_id, status);
      });
      setMessageStatuses(statusMap);
    } catch (error: any) {
      console.error('Failed to load message statuses:', error);
    }
  };

  const getStatusBadge = (message: WhatsAppMessage) => {
    const status = messageStatuses.get(message.message_sid || message.id);
    const currentStatus = status?.status || message.status;
    
    switch (currentStatus) {
      case 'queued':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Queued</Badge>;
      case 'sent':
        return <Badge variant="outline" className="gap-1"><CheckCheck className="w-3 h-3" /> Sent</Badge>;
      case 'delivered':
        return <Badge variant="default" className="gap-1"><CheckCheck className="w-3 h-3" /> Delivered</Badge>;
      case 'read':
        return <Badge variant="default" className="gap-1"><CheckCheck className="w-3 h-3 text-blue-500" /> Read</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{currentStatus}</Badge>;
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const phoneNumber = prompt('Enter WhatsApp number (with country code, e.g., +14155551234):');
    if (!phoneNumber) return;

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          to: phoneNumber,
          message: newMessage
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('WhatsApp message sent successfully');
        setNewMessage('');
        
        // Add to local state for immediate feedback
        const newMsg: WhatsAppMessage = {
          id: data.message_sid,
          phone_number: phoneNumber,
          direction: 'outbound',
          status: data.status,
          message_body: newMessage,
          media_urls: null,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [newMsg, ...prev]);
      } else {
        throw new Error(data?.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('WhatsApp send error:', error);
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
