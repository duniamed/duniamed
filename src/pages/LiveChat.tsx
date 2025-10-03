import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Clock, CheckCircle2, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

/**
 * C7 SUPPORT - Live Chat with CSAT Ratings
 * 
 * PATIENT WORKFLOW:
 * 1. Click "Get Help" button (always visible)
 * 2. Live chat connects with support agent within SLA
 * 3. Real-time messaging with typing indicators
 * 4. File attachment support for screenshots
 * 5. After resolution: CSAT rating (1-5 stars) + feedback
 * 6. Ticket history available for reference
 * 
 * SPECIALIST WORKFLOW:
 * 1. Priority support with dedicated channel
 * 2. Escalation to supervisor if needed
 * 3. SLA timer visible for accountability
 * 4. Technical support for clinical features
 * 5. Post-chat satisfaction survey
 * 
 * CLINIC WORKFLOW:
 * 1. Multi-agent support queue management
 * 2. Analytics dashboard for CSAT scores
 * 3. Multilingual support routing
 * 4. Privacy-compliant chat transcripts
 * 5. Staff training based on low CSAT
 * 
 * INTEGRATION: Real-time messaging via Supabase Realtime
 * - Instant message delivery
 * - Presence indicators
 * - Message read receipts
 * - Typing indicators
 */

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
}

export default function LiveChat() {
  const { toast } = useToast();
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadActiveTicket();
  }, []);

  useEffect(() => {
    if (activeTicket) {
      loadMessages();
      subscribeToMessages();
    }
  }, [activeTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadActiveTicket = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setActiveTicket(data);
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
    }
  };

  const loadMessages = async () => {
    if (!activeTicket) return;

    try {
      const { data } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', activeTicket.id)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!activeTicket) return;

    const channel = supabase
      .channel(`support_${activeTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `ticket_id=eq.${activeTicket.id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createTicket = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          category: 'general',
          priority: 'medium',
          subject: 'Live Chat Support',
          description: 'User initiated live chat'
        })
        .select()
        .single();

      if (error) throw error;

      setActiveTicket(data);
      toast({
        title: "Chat started",
        description: "A support agent will be with you shortly",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeTicket) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('support_ticket_messages')
        .insert({
          ticket_id: activeTicket.id,
          sender_id: user.id,
          message: newMessage,
          is_staff: false
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const closeTicket = async () => {
    if (!activeTicket) return;

    setShowRating(true);
  };

  const submitRating = async () => {
    if (!activeTicket) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          rating,
          rating_comment: ratingComment
        })
        .eq('id', activeTicket.id);

      if (error) throw error;

      toast({
        title: "Thank you for your feedback!",
        description: "We appreciate your rating and will use it to improve",
      });

      setActiveTicket(null);
      setShowRating(false);
      setRating(0);
      setRatingComment('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const calculateSLA = () => {
    if (!activeTicket?.sla_deadline) return null;
    
    const deadline = new Date(activeTicket.sla_deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    
    return minutes > 0 ? `${minutes} min remaining` : 'SLA exceeded';
  };

  if (!activeTicket) {
    return (
      <Layout>
        <div className="container max-w-2xl py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Live Chat Support (C7)
              </CardTitle>
              <CardDescription>
                Get instant help from our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Need help?</h3>
              <p className="text-muted-foreground mb-6">
                Start a live chat with our support team. We typically respond within 2 minutes.
              </p>
              <Button onClick={createTicket} disabled={loading} size="lg">
                <MessageSquare className="h-5 w-5 mr-2" />
                Start Live Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Chat - Ticket #{activeTicket.ticket_number}
                </CardTitle>
                <CardDescription>
                  {activeTicket.assigned_to ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Agent connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Waiting for agent...
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {activeTicket.sla_deadline && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {calculateSLA()}
                  </Badge>
                )}
                <Badge>{activeTicket.priority}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_staff ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.is_staff
                          ? 'bg-muted'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-4">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={closeTicket}>
                End Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Support Experience</DialogTitle>
            <DialogDescription>
              Help us improve by rating this support interaction
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      value <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Additional feedback (optional)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              rows={3}
            />

            <Button onClick={submitRating} className="w-full" disabled={rating === 0}>
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
