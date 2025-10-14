import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Phone, Send } from 'lucide-react';

export const AdvancedMessaging = ({ patientId }: { patientId: string }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [message, setMessage] = useState('');

  const sendSmartSMS = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-sms-routing', {
        body: { 
          patientId,
          message,
          priority: 'normal'
        }
      });
      
      if (error) throw error;
      toast({ title: 'Message sent', description: 'SMS delivered successfully' });
      setMessage('');
    } catch (error: any) {
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const initiateVoiceCall = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-navigation-command', {
        body: { 
          patientId,
          action: 'initiate_call',
          context: 'appointment_reminder'
        }
      });
      
      if (error) throw error;
      toast({ title: 'Call initiated', description: 'Voice call started' });
    } catch (error: any) {
      toast({ title: 'Call failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Advanced Communications
        </CardTitle>
        <CardDescription>Smart messaging and voice navigation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />
        <div className="flex gap-2">
          <Button onClick={sendSmartSMS} disabled={loading || !message} className="flex-1">
            <Send className="mr-2 h-4 w-4" />
            Send Smart SMS
          </Button>
          <Button onClick={initiateVoiceCall} disabled={loading} variant="outline">
            <Phone className="mr-2 h-4 w-4" />
            Voice Call
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
