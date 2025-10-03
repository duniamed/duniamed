import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Inbox, Clock, AlertTriangle, CheckCircle2, Archive } from 'lucide-react';
import { format } from 'date-fns';

/**
 * C14 DELIVERY - Unified Clinic Messages Inbox
 * Centralized inbox for managing critical messages with SLA tracking
 */

function ClinicMessagesInboxContent() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, [selectedTab]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get clinics where user is staff
      const { data: clinicIds } = await supabase
        .from('clinic_staff')
        .select('clinic_id')
        .eq('user_id', user.id);

      if (!clinicIds?.length) {
        setMessages([]);
        return;
      }

      let query = supabase
        .from('notification_delivery')
        .select(`
          *,
          notification_channels(channel_type, contact_info)
        `)
        .order('created_at', { ascending: false });

      if (selectedTab === 'pending') {
        query = query.eq('status', 'pending');
      } else if (selectedTab === 'escalated') {
        query = query.eq('status', 'failed');
      } else if (selectedTab === 'completed') {
        query = query.eq('status', 'delivered');
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('clinic-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_deliveries'
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAcknowledge = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('notification_delivery')
        .update({ delivered_at: new Date().toISOString(), status: 'read' })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Message acknowledged",
        description: "The message has been marked as handled"
      });

      loadMessages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getAgeBadge = (createdAt: string) => {
    const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (hours < 1) return <Badge variant="default">New</Badge>;
    if (hours < 24) return <Badge variant="secondary">{Math.floor(hours)}h old</Badge>;
    return <Badge variant="destructive">{Math.floor(hours / 24)}d old</Badge>;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'critical' || priority === 'high') return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (priority === 'medium') return <Clock className="h-4 w-4 text-orange-500" />;
    return <Inbox className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <DashboardLayout
      title="Messages Inbox"
      description="Manage critical clinic communications with SLA tracking"
    >
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="escalated">Escalated</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading messages...
              </CardContent>
            </Card>
          ) : messages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages in this category</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => (
              <Card key={message.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(message.channel || 'medium')}
                    {(message.channel || 'MESSAGE').replace(/_/g, ' ').toUpperCase()}
                  </div>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getAgeBadge(message.created_at)}
                      {message.status === 'delivered' && (
                        <Badge variant="default">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Delivered
                        </Badge>
                      )}
                      {message.status === 'failed' && (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{message.message_id || 'No message content'}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Channel: {message.notification_channels?.channel_type}</div>
                      <div>Sent: {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}</div>
                      {message.sent_at && (
                        <div>Sent: {format(new Date(message.sent_at), 'MMM d, yyyy h:mm a')}</div>
                      )}
                    </div>

                    {message.status !== 'delivered' && message.status !== 'read' && (
                      <Button
                        size="sm"
                        onClick={() => handleAcknowledge(message.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

export default function ClinicMessagesInbox() {
  return (
    <ProtectedRoute>
      <ClinicMessagesInboxContent />
    </ProtectedRoute>
  );
}
