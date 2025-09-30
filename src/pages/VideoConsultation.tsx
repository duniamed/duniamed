import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VideoConsultation() {
  return (
    <ProtectedRoute>
      <VideoConsultationContent />
    </ProtectedRoute>
  );
}

function VideoConsultationContent() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    if (!appointmentId) return;

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (!error && data) {
      setAppointment(data);
      
      // In production, initialize Daily.co or Twilio video here
      // For now, this is a placeholder UI
    }

    setLoading(false);
  };

  const handleEndCall = async () => {
    toast({
      title: 'Call Ended',
      description: 'The consultation has been completed',
    });
    navigate(`/appointments/${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 relative">
        {/* Video placeholder - Replace with actual video component */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <Video className="h-24 w-24 text-gray-600 mx-auto mb-4" />
            <p className="text-white text-lg">Video Consultation</p>
            <p className="text-gray-400 text-sm mt-2">
              Daily.co integration pending - Placeholder UI
            </p>
          </div>
        </div>

        {/* Local video preview (small) */}
        <Card className="absolute bottom-24 right-4 w-48 h-36 overflow-hidden">
          <CardContent className="p-0 h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <Video className="h-8 w-8 text-gray-600 mx-auto" />
              <p className="text-gray-400 text-xs mt-2">You</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="bg-black/80 backdrop-blur-lg p-6">
        <div className="container flex justify-center gap-4">
          <Button
            size="lg"
            variant={isMuted ? 'destructive' : 'secondary'}
            className="rounded-full h-14 w-14"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Button>

          <Button
            size="lg"
            variant={isVideoOff ? 'destructive' : 'secondary'}
            className="rounded-full h-14 w-14"
            onClick={() => setIsVideoOff(!isVideoOff)}
          >
            {isVideoOff ? <VideoOff /> : <Video />}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            className="rounded-full h-14 w-14"
            onClick={handleEndCall}
          >
            <Phone className="rotate-135" />
          </Button>
        </div>
      </div>
    </div>
  );
}
