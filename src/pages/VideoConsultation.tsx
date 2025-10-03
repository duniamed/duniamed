import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { VideoHealthMonitor } from '@/components/VideoHealthMonitor';
import { AutoReschedule } from '@/components/AutoReschedule';

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
  const { profile } = useAuth();
  const [appointment, setAppointment] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showHealthMonitor, setShowHealthMonitor] = useState(true);
  const [needsReschedule, setNeedsReschedule] = useState(false);
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAppointment();
    
    return () => {
      // Cleanup video call on unmount
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, [appointmentId]);

  const fetchAppointment = async () => {
    if (!appointmentId || !profile) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      if (data) {
        setAppointment(data);
        await initializeVideoRoom(data);
      }
    } catch (error: any) {
      console.error('Error fetching appointment:', error);
      setVideoError(error.message);
    }

    setLoading(false);
  };

  const initializeVideoRoom = async (appointmentData: any) => {
    try {
      // Check if we already have a video room URL
      if (appointmentData.video_room_url) {
        await loadDailyScript();
        createCallFrame(appointmentData.video_room_url);
        return;
      }

      // Create a new video room via edge function
      const { data, error } = await supabase.functions.invoke('create-video-room', {
        body: {
          appointmentId: appointmentData.id,
          userName: `${profile.first_name} ${profile.last_name}`
        }
      });

      if (error) throw error;

      // Update appointment with video room URL
      await supabase
        .from('appointments')
        .update({ 
          video_room_url: data.roomUrl,
          video_room_id: data.roomUrl.split('/').pop()
        })
        .eq('id', appointmentData.id);

      await loadDailyScript();
      createCallFrame(data.roomUrl, data.token);
    } catch (error: any) {
      console.error('Error initializing video room:', error);
      setVideoError('Failed to initialize video room. Please try again.');
    }
  };

  const loadDailyScript = () => {
    return new Promise((resolve, reject) => {
      if ((window as any).DailyIframe) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const createCallFrame = (url: string, token?: string) => {
    if (!containerRef.current || !(window as any).DailyIframe) return;

    const DailyIframe = (window as any).DailyIframe;
    
    callFrameRef.current = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        border: '0',
      },
      showLeaveButton: true,
    });

    const joinOptions: any = { url };
    if (token) {
      joinOptions.token = token;
    }

    callFrameRef.current.join(joinOptions);

    // Handle call events
    callFrameRef.current
      .on('left-meeting', handleEndCall)
      .on('error', (error: any) => {
        console.error('Daily.co error:', error);
        setVideoError('Video connection error. Please refresh.');
      });
  };

  const handleEndCall = async () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
      callFrameRef.current.destroy();
    }

    // Update appointment status
    if (appointmentId) {
      await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', appointmentId);
    }

    toast({
      title: 'Call Ended',
      description: 'The consultation has been completed',
    });
    navigate(`/appointments/${appointmentId}`);
  };

  const toggleMute = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(!isMuted);
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(!isVideoOff);
    }
    setIsVideoOff(!isVideoOff);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Connecting to video consultation...</p>
        </div>
      </div>
    );
  }

  if (videoError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="max-w-2xl w-full space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Video className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Connection Error</h2>
                <p className="text-muted-foreground mb-4">{videoError}</p>
                <Button onClick={() => navigate(`/appointments/${appointmentId}`)}>
                  Back to Appointment
                </Button>
              </div>
            </CardContent>
          </Card>

          {needsReschedule && appointment && (
            <AutoReschedule
              appointmentId={appointmentId!}
              originalDateTime={appointment.scheduled_at}
              specialistId={appointment.specialist_id}
              reason={videoError}
              onRescheduled={() => navigate(`/appointments/${appointmentId}`)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 relative">
        {/* Pre-session health monitor */}
        {showHealthMonitor && appointment && (
          <div className="absolute top-4 right-4 z-10 w-80">
            <VideoHealthMonitor
              appointmentId={appointmentId!}
              sessionId={appointment.video_room_id}
              onFallbackNeeded={() => {
                setVideoError('Poor connection detected - switching to audio only');
                setNeedsReschedule(true);
              }}
            />
          </div>
        )}

        {/* Daily.co video container */}
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      {/* Controls */}
      <div className="bg-black/80 backdrop-blur-lg p-6">
        <div className="container flex justify-center gap-4">
          <Button
            size="lg"
            variant={isMuted ? 'destructive' : 'secondary'}
            className="rounded-full h-14 w-14"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Button>

          <Button
            size="lg"
            variant={isVideoOff ? 'destructive' : 'secondary'}
            className="rounded-full h-14 w-14"
            onClick={toggleVideo}
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
