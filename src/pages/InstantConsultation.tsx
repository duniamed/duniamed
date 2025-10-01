import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Star, MapPin, Loader2, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OnlineSpecialist {
  id: string;
  user_id: string;
  specialties: string[];
  consultation_fee_min: number;
  currency: string;
  average_rating: number;
  total_reviews: number;
  years_experience: number;
  profile: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

export default function InstantConsultation() {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <InstantConsultationContent />
    </ProtectedRoute>
  );
}

function InstantConsultationContent() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [specialists, setSpecialists] = useState<OnlineSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    fetchOnlineSpecialists();
  }, []);

  const fetchOnlineSpecialists = async () => {
    const { data, error } = await supabase
      .from('specialists')
      .select(`
        id,
        user_id,
        specialties,
        consultation_fee_min,
        currency,
        average_rating,
        total_reviews,
        years_experience,
        profile:user_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('is_online', true)
      .eq('is_accepting_patients', true)
      .order('average_rating', { ascending: false });

    if (!error && data) {
      setSpecialists(data as any);
    }
    setLoading(false);
  };

  const requestInstantConsultation = async (specialistId: string) => {
    if (!profile) return;
    
    setRequesting(specialistId);

    try {
      // Get patient timezone
      const patientTimezone = profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const patientLanguage = profile.language_preference || 'en';

      // Call intelligent routing
      const { data: routingData, error: routingError } = await supabase.functions.invoke('instant-connect', {
        body: {
          patientTimezone,
          patientLanguage,
          urgencyLevel: 'routine'
        }
      });

      if (routingError) throw routingError;

      const matchedSpecialist = routingData.specialist;
      if (!matchedSpecialist) {
        toast({
          title: 'No specialists available',
          description: routingData.message || 'Please try again in a few minutes.',
          variant: 'destructive',
        });
        setRequesting(null);
        return;
      }

      // Create an appointment with the matched specialist
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: profile.id,
          specialist_id: matchedSpecialist.id,
          scheduled_at: new Date().toISOString(),
          duration_minutes: 30,
          consultation_type: 'video' as const,
          status: 'pending' as const,
          urgency_level: 'routine' as const,
          fee: matchedSpecialist.consultation_fee_min,
          currency: matchedSpecialist.currency,
          notes: 'Instant consultation - intelligent routing'
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Best Match Found!',
        description: `Connected with Dr. ${matchedSpecialist.profiles?.first_name} ${matchedSpecialist.profiles?.last_name}. Redirecting...`,
      });

      // Navigate to video consultation
      setTimeout(() => {
        navigate(`/consultation/${appointment.id}`);
      }, 2000);
    } catch (error: any) {
      console.error('Instant connect error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start consultation',
        variant: 'destructive',
      });
    } finally {
      setRequesting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="container-modern py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section - Loss Aversion Framing */}
          <div className="text-center space-y-4 py-8">
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {specialists.length} Doctors Online & Ready
                </span>
              </div>
              <Badge className="urgency-badge border-0">
                <Clock className="h-3.5 w-3.5" />
                Average wait: &lt;2 minutes
              </Badge>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Don't suffer another minute
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your health concern won't improve by waiting. Connect with top specialists <span className="font-semibold text-foreground">right now</span> - no appointments, no delays.
            </p>
            
            {/* Loss Aversion Warning */}
            <div className="glass-panel max-w-2xl mx-auto bg-yellow-500/5 border-yellow-500/20">
              <div className="pt-6 pb-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-semibold text-yellow-700 dark:text-yellow-500 mb-1">
                      Why risk waiting for an appointment?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Every hour you delay, symptoms can worsen. Traditional appointments take days or weeks. 
                      <span className="font-medium text-foreground"> Connect instantly before spots fill up.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specialists Grid */}
          {specialists.length === 0 ? (
            <div className="card-modern border-2">
              <div className="py-16 text-center">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-bold mb-2">No Specialists Online</h3>
                <p className="text-muted-foreground mb-6">
                  All specialists are currently busy. Try scheduling an appointment instead.
                </p>
                <Button onClick={() => navigate('/search')} size="lg">
                  Schedule Appointment
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {specialists.map((specialist) => (
                <Card 
                  key={specialist.id} 
                  className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50 relative overflow-hidden"
                >
                  {/* Online Indicator */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-medium">
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      Online
                    </div>
                  </div>

                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 relative">
                      <Avatar className="h-24 w-24 border-4 border-primary/20 ring-4 ring-primary/10">
                        <AvatarImage src={specialist.profile?.avatar_url} />
                        <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/60 text-white">
                          {specialist.profile?.first_name?.[0]}{specialist.profile?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-green-500 border-4 border-background">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">
                      Dr. {specialist.profile?.first_name} {specialist.profile?.last_name}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {specialist.specialties?.[0] || 'General Practice'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm border-t border-b py-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold">{specialist.average_rating?.toFixed(1) || '5.0'}</span>
                        <span className="text-muted-foreground">({specialist.total_reviews || 0})</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{specialist.years_experience || 5}+ years</span>
                      </div>
                    </div>

                    {/* Fee with Anchoring */}
                    <div className="bg-primary/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Consultation Fee</span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {specialist.currency} {specialist.consultation_fee_min}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            vs. ER visit: ${specialist.consultation_fee_min * 10}+
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Most insurance plans accepted
                      </p>
                    </div>

                    {/* Scarcity Indicator */}
                    <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-500 bg-yellow-500/10 rounded px-3 py-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="font-medium">High demand - Connect now before unavailable</span>
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="w-full h-12 text-base font-semibold group-hover:shadow-lg transition-all shadow-primary"
                      size="lg"
                      onClick={() => requestInstantConsultation(specialist.id)}
                      disabled={requesting === specialist.id}
                    >
                      {requesting === specialist.id ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Video className="mr-2 h-5 w-5" />
                          Connect Now - Don't Wait
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground">
                      ✓ Instant connection ✓ No appointment needed
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-3 mt-12">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <Video className="h-8 w-8 text-blue-500 mb-2" />
                <h3 className="font-bold mb-1">Instant Connection</h3>
                <p className="text-sm text-muted-foreground">Connect within seconds, no waiting</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                <h3 className="font-bold mb-1">HIPAA Compliant</h3>
                <p className="text-sm text-muted-foreground">Secure & encrypted video calls</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <Star className="h-8 w-8 text-purple-500 mb-2" />
                <h3 className="font-bold mb-1">Top Rated Doctors</h3>
                <p className="text-sm text-muted-foreground">Verified & experienced specialists</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
