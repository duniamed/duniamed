import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Mail, MessageSquare, Phone, Bell, CheckCircle2 } from 'lucide-react';

/**
 * C4 RESILIENCE - Multi-Channel Notification Preferences
 * 
 * PATIENT WORKFLOW:
 * 1. Add multiple contact channels (email, SMS, WhatsApp)
 * 2. Verify each channel with confirmation code
 * 3. Set primary channel for critical notifications
 * 4. Enable redundant notifications for important events
 * 5. System automatically falls back to secondary channels if primary fails
 * 
 * INTEGRATION:
 * - Email via Resend
 * - SMS via Twilio
 * - WhatsApp Business API
 * - Push notifications via FCM
 */

interface NotificationChannel {
  id: string;
  channel_type: 'email' | 'sms' | 'whatsapp' | 'push';
  channel_value: string;
  is_verified: boolean;
  is_primary: boolean;
}

export function NotificationChannels() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChannel, setNewChannel] = useState({ type: 'email', value: '' });

  useEffect(() => {
    loadChannels();
  }, [user]);

  const loadChannels = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setChannels((data || []) as NotificationChannel[]);
    } catch (error: any) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const addChannel = async () => {
    if (!user || !newChannel.value.trim()) {
      toast({
        title: "Value required",
        description: "Please enter a valid contact method",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notification_channels')
        .insert({
          user_id: user.id,
          channel_type: newChannel.type,
          channel_value: newChannel.value,
          is_primary: channels.length === 0
        });

      if (error) throw error;

      toast({
        title: "Channel added",
        description: "Please check for a verification message"
      });

      setNewChannel({ type: 'email', value: '' });
      loadChannels();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const setPrimary = async (channelId: string) => {
    try {
      // Remove primary from all channels
      await supabase
        .from('notification_channels')
        .update({ is_primary: false })
        .eq('user_id', user!.id);

      // Set new primary
      const { error } = await supabase
        .from('notification_channels')
        .update({ is_primary: true })
        .eq('id', channelId);

      if (error) throw error;

      toast({
        title: "Primary channel updated",
        description: "This channel will be used for critical notifications"
      });

      loadChannels();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteChannel = async (channelId: string) => {
    try {
      const { error } = await supabase
        .from('notification_channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;

      toast({
        title: "Channel removed",
        description: "Notification channel has been deleted"
      });

      loadChannels();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  if (loading) return <div>Loading notification preferences...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels (C4)</CardTitle>
          <CardDescription>
            Add multiple channels for redundant notifications. We'll automatically failover if one channel is unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Channels */}
          {channels.map((channel) => (
            <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getChannelIcon(channel.channel_type)}
                <div>
                  <p className="font-medium">{channel.channel_value}</p>
                  <p className="text-xs text-muted-foreground capitalize">{channel.channel_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {channel.is_verified && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {channel.is_primary && (
                  <Badge>Primary</Badge>
                )}
                {!channel.is_primary && channel.is_verified && (
                  <Button size="sm" variant="outline" onClick={() => setPrimary(channel.id)}>
                    Set as Primary
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => deleteChannel(channel.id)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}

          {/* Add New Channel */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium">Add New Channel</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Type</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={newChannel.type}
                  onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })}
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label>Value</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      newChannel.type === 'email' ? 'email@example.com' :
                      newChannel.type === 'sms' ? '+1234567890' :
                      '+1234567890'
                    }
                    value={newChannel.value}
                    onChange={(e) => setNewChannel({ ...newChannel, value: e.target.value })}
                  />
                  <Button onClick={addChannel}>Add</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

