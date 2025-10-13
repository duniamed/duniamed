import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Heart, FileText, Activity, Sparkles, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { SmartSpecialistRecommendations } from '@/components/patient/SmartSpecialistRecommendations';

export default function PatientDashboardHome() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile?.id]);

  const fetchDashboardData = async () => {
    if (!profile?.id) return;

    // Fetch upcoming appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        *,
        specialist:specialists(
          id,
          specialty,
          user:profiles(first_name, last_name, avatar_url)
        )
      `)
      .eq('patient_id', profile.id)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(3);

    // Fetch favorite specialists
    const { data: favs } = await supabase
      .from('favorites')
      .select(`
        *,
        specialist:specialists(
          id,
          specialty,
          is_online,
          user:profiles(first_name, last_name, avatar_url)
        )
      `)
      .eq('patient_id', profile.id)
      .limit(4);

    setUpcomingAppointments(appointments || []);
    setFavorites(favs || []);
    setLoading(false);
  };

  return (
    <DashboardLayout 
      title={`Welcome back, ${profile?.first_name}!`}
      description="Your health journey at a glance"
      showBackButton={false}
    >
      <div className="space-y-6">
        {/* Smart Specialist Finder */}
        <Card className="border-2 border-primary/30 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Smart Specialist Finder</CardTitle>
                <CardDescription className="text-base">AI-powered matching finds the perfect doctor for your symptoms</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <SmartSpecialistRecommendations />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/patient/appointments">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                <p className="text-xs text-muted-foreground">Upcoming visits</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/patient/medical-records">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">View</div>
                <p className="text-xs text-muted-foreground">Access your health data</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/patient/favorites">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{favorites.length}</div>
                <p className="text-xs text-muted-foreground">Saved doctors</p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled consultations</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming appointments</p>
                <Button asChild className="mt-4">
                  <Link to="/search/specialists">Book an Appointment</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        Dr. {apt.specialist?.user?.first_name} {apt.specialist?.user?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {apt.specialist?.specialty?.[0] || 'General Practice'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{format(new Date(apt.scheduled_at), 'PPp')}</span>
                        <Badge variant={apt.consultation_type === 'video' ? 'default' : 'secondary'} className="text-xs">
                          {apt.consultation_type}
                        </Badge>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/patient/appointments/${apt.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Favorite Doctors */}
        {favorites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Favorite Doctors</CardTitle>
              <CardDescription>Quick access to your preferred specialists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {favorites.map((fav) => (
                  <div key={fav.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      {fav.specialist?.user?.avatar_url ? (
                        <img
                          src={fav.specialist.user.avatar_url}
                          alt={`Dr. ${fav.specialist?.user?.first_name}`}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {fav.specialist?.user?.first_name?.[0]}{fav.specialist?.user?.last_name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          Dr. {fav.specialist?.user?.first_name} {fav.specialist?.user?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {fav.specialist?.specialty?.[0]}
                        </p>
                      </div>
                    </div>
                    {fav.specialist?.is_online && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 mb-2">
                        Online Now
                      </Badge>
                    )}
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/specialists/${fav.specialist_id}`}>View Profile</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Tips */}
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Book via WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Chat with our AI to find the right doctor instantly
              </p>
              <Button onClick={() => navigate("/whatsapp-booking")} className="w-full">
                Start WhatsApp Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/messages")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Doctor
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/medical-records")}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Records
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Health Tips */}
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Schedule regular check-ups to stay on top of your health</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Keep your medical records updated for better care coordination</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Use our symptom checker for quick health assessments</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
