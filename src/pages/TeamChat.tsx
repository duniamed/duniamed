import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  message_content: string;
  created_at: string;
  is_urgent: boolean;
}

export default function TeamChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv);
      
      const channel = supabase
        .channel('team-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `conversation_id=eq.${selectedConv}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConv]);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staff } = await supabase
        .from('clinic_staff')
        .select('clinic_id')
        .eq('user_id', user.id);

      if (!staff || staff.length === 0) return;

      const { data, error } = await supabase
        .from('team_conversations')
        .select('*')
        .in('clinic_id', staff.map(s => s.clinic_id))
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      if (data && data.length > 0) setSelectedConv(data[0].id);
    } catch (error: any) {
      toast({
        title: 'Error loading conversations',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('team_messages')
        .insert({
          conversation_id: selectedConv,
          sender_id: user.id,
          message_content: newMessage,
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Team Chat</h1>
          </div>
          <p className="text-muted-foreground">
            Collaborate with your clinic team
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant={selectedConv === conv.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedConv(conv.id)}
                  >
                    {conv.subject || 'General'}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-96 pr-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">{msg.message_content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}