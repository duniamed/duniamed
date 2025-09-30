import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  read_at: string | null;
}

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export default function Messages() {
  return <MessagesContent />;
}

function MessagesContent() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    if (!user) return;

    // This is a simplified version - in production, you'd need a proper conversations view
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(first_name, last_name), recipient:recipient_id(first_name, last_name)')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      // Group by conversation partner
      const convMap = new Map<string, Conversation>();
      
      data.forEach((msg: any) => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const partnerName = msg.sender_id === user.id 
          ? `${msg.recipient?.first_name} ${msg.recipient?.last_name}`
          : `${msg.sender?.first_name} ${msg.sender?.last_name}`;

        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            id: partnerId,
            other_user_id: partnerId,
            other_user_name: partnerName,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: msg.recipient_id === user.id && !msg.read_at ? 1 : 0,
          });
        }
      });

      setConversations(Array.from(convMap.values()));
    }

    setLoading(false);
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
      
      // Mark as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('sender_id', partnerId)
        .is('read_at', null);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    // Generate a conversation_id from the two user IDs (sorted for consistency)
    const conversationId = [user.id, selectedConversation].sort().join('-');

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      recipient_id: selectedConversation,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
      fetchMessages(selectedConversation);
      fetchConversations();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-4 border-b cursor-pointer hover:bg-accent ${
                        selectedConversation === conv.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedConversation(conv.id)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{conv.other_user_name}</span>
                        {conv.unread_count > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(conv.last_message_at), 'MMM dd, hh:mm a')}
                      </p>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="col-span-8">
            {selectedConversation ? (
              <>
                <CardHeader>
                  <CardTitle>
                    {conversations.find(c => c.id === selectedConversation)?.other_user_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-[calc(100vh-350px)]">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-accent'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {format(new Date(message.created_at), 'hh:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
