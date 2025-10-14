import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VideoConsultationRoomProps {
  appointmentId: string;
}

const VideoConsultationRoom = ({ appointmentId }: VideoConsultationRoomProps) => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const startConsultation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telemedicine-room-manager', {
        body: { 
          action: 'create_room', 
          appointmentId,
          roomConfig: { recordSession: true }
        }
      });

      if (error) throw error;

      setRoomUrl(data.room.url);
      toast({
        title: "Video room created",
        description: "Starting your consultation...",
      });
    } catch (error: any) {
      toast({
        title: "Failed to start consultation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const endConsultation = () => {
    setRoomUrl(null);
    toast({
      title: "Consultation ended",
      description: "The video call has been terminated.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Consultation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!roomUrl ? (
          <Button onClick={startConsultation} disabled={loading} className="w-full">
            <Video className="mr-2 h-4 w-4" />
            {loading ? 'Starting...' : 'Start Consultation'}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Video stream would display here</p>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button
                variant={videoEnabled ? "default" : "destructive"}
                size="icon"
                onClick={() => setVideoEnabled(!videoEnabled)}
              >
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              
              <Button
                variant={audioEnabled ? "default" : "destructive"}
                size="icon"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              
              <Button variant="outline" size="icon">
                <Monitor className="h-4 w-4" />
              </Button>
              
              <Button variant="destructive" size="icon" onClick={endConsultation}>
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoConsultationRoom;
