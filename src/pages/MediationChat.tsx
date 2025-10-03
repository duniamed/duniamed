import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, FileText, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';

interface Message {
  id: string;
  complaint_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface Complaint {
  id: string;
  title: string;
  ticket_number: string;
  status: string;
  mediation_status: string;
}

function MediationChatContent() {
  const { complaintId } = useParams<{ complaintId: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUser();
    if (complaintId) {
      loadComplaint();
      loadMessages();
      subscribeToMessages();
    }
  }, [complaintId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const loadComplaint = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('id, title, ticket_number, status, mediation_status')
        .eq('id', complaintId)
        .single();

      if (error) throw error;
      setComplaint(data as any);
    } catch (error: any) {
      toast({
        title: 'Error loading complaint',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('complaint_messages')
        .select(`
          *,
          profiles!complaint_messages_sender_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as any);
    } catch (error: any) {
      toast({
        title: 'Error loading messages',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`complaint_messages:${complaintId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaint_messages',
          filter: `complaint_id=eq.${complaintId}`,
        },
        (payload) => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    try {
      const { error } = await supabase
        .from('complaint_messages')
        .insert({
          complaint_id: complaintId,
          sender_id: userId,
          sender_type: 'participant',
          message: newMessage,
          is_internal: false,
        });

      if (error) throw error;

      setNewMessage('');
      toast({
        title: 'Message sent',
        description: 'Your message has been delivered',
      });
    } catch (error: any) {
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getSenderType = (senderId: string, senderType: string) => {
    if (senderType === 'mediator') return 'Mediator';
    if (senderId === userId) return 'You';
    return 'Other Party';
  };

  return (
    <DashboardLayout>
      <div className="container-modern py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Mediation Chat
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {complaint?.title}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{complaint?.ticket_number}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Status: {complaint?.mediation_status}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Messages */}
          <Card className="h-[500px] flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-muted-foreground">
                    Start the conversation by sending the first message
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === userId;
                    const isMediator = message.sender_type === 'mediator';

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <Avatar className={isMediator ? 'border-2 border-blue-500' : ''}>
                          <AvatarFallback>
                            {isMediator ? <Shield className="h-4 w-4" /> : 
                             getInitials(message.profiles?.first_name, message.profiles?.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 max-w-md ${isOwn ? 'text-right' : 'text-left'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">
                              {getSenderType(message.sender_id, message.sender_type)}
                            </p>
                            {isMediator && (
                              <Badge variant="secondary" className="text-xs">
                                Mediator
                              </Badge>
                            )}
                          </div>
                          <div
                            className={`rounded-lg p-3 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : isMediator
                                ? 'bg-blue-100 dark:bg-blue-900'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </CardContent>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={3}
                  className="resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                  className="h-auto"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function MediationChat() {
  return (
    <ProtectedRoute allowedRoles={['patient', 'specialist', 'clinic_admin']}>
      <MediationChatContent />
    </ProtectedRoute>
  );
}
