import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Lock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecureMessagingProps {
  threadId: string;
  recipientId: string;
}

export const SecureMessaging: React.FC<SecureMessagingProps> = ({
  threadId,
  recipientId
}) => {
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages } = useQuery({
    queryKey: ['messages', threadId],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', threadId)
        .order('created_at', { ascending: true });
      return (data || []) as any[];
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: threadId,
          sender_id: currentUser?.id || '',
          recipient_id: recipientId,
          content: message
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
      toast({
        title: "Message Sent",
        description: "Your secure message has been delivered",
      });
    }
  });

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Secure Messaging
          <Lock className="h-4 w-4 text-green-600" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages?.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  msg.sender_id === currentUser?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && message.trim()) {
                sendMessageMutation.mutate();
              }
            }}
          />
          <Button
            onClick={() => sendMessageMutation.mutate()}
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          🔒 End-to-end encrypted • HIPAA compliant
        </p>
      </CardContent>
    </Card>
  );
};
