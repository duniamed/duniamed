import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, MapPin, Calendar, DollarSign, Award, Languages, Clock, Phone, Mail } from 'lucide-react';

interface Specialist {
  id: string;
  specialty: string[];
  sub_specialty: string[];
  bio: string;
  languages: string[];
  years_experience: number;
  average_rating: number;
  total_reviews: number;
  total_consultations: number;
  consultation_fee_min: number;
  consultation_fee_max: number;
  currency: string;
  medical_school: string;
  graduation_year: number;
  license_country: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    country: string;
    city: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  is_anonymous: boolean;
  specialist_response: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export default function SpecialistProfile() {
  return <SpecialistProfileContent />;
}

function SpecialistProfileContent() {
  const { id } = useParams<{ id: string }>();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecialist();
    fetchReviews();
  }, [id]);

  const fetchSpecialist = async () => {
    const { data, error } = await supabase
      .from('specialists')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url,
          country,
          city
        )
      `)
      .eq('id', id)
      .single();

    if (!error && data) {
      setSpecialist(data as any);
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles:patient_id (
          first_name,
          last_name
        )
      `)
      .eq('specialist_id', id)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data as any);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-modern py-12 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!specialist) {
    return (
      <Layout>
        <div className="container-modern py-12">
          <Card className="shadow-xl">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Specialist not found</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-modern py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Main Profile Card */}
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-[400px_1fr] gap-0">
                {/* Left: Doctor Photo & Contact */}
                <div className="bg-gradient-to-br from-muted/30 to-muted/10 p-8 flex flex-col items-center justify-center space-y-6 border-r">
                  <Avatar className="h-48 w-48 border-4 border-background shadow-xl">
                    <AvatarFallback className="text-5xl font-bold bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                      {specialist.profiles?.first_name?.[0]}
                      {specialist.profiles?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center space-y-2 w-full">
                    <h1 className="text-3xl font-bold">
                      Dr. {specialist.profiles?.first_name} {specialist.profiles?.last_name}
                    </h1>
                    <p className="text-base text-muted-foreground uppercase tracking-wide font-semibold">
                      {specialist.specialty[0]}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {specialist.profiles?.city}, {specialist.profiles?.country}
                    </p>
                  </div>

                  <Separator className="w-full" />
                  
                  {/* Contact Info */}
                  <div className="w-full space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Languages className="h-4 w-4" />
                      <span>{specialist.languages.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Details & Actions */}
                <div className="p-8 space-y-6">
                  {/* Rating Badge - Prominent Yellow */}
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="inline-flex items-center gap-3 bg-[hsl(var(--accent-yellow))] text-[hsl(var(--accent-yellow-foreground))] px-6 py-4 rounded-2xl shadow-lg">
                        <div className="text-center">
                          <div className="text-4xl font-bold leading-none">{specialist.average_rating.toFixed(1)}</div>
                          <div className="text-xs font-semibold mt-1">{specialist.total_reviews} reviews</div>
                        </div>
                      </div>
                      
                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-xl bg-muted/30">
                          <div className="flex items-center justify-center gap-1 text-yellow-600">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-current" />
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 font-medium">Wait Time</div>
                          <div className="text-sm font-bold mt-0.5">4:03</div>
                        </div>
                        
                        <div className="text-center p-4 rounded-xl bg-muted/30">
                          <div className="flex items-center justify-center gap-1 text-green-600">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-current" />
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 font-medium">Bedside Manner</div>
                          <div className="text-sm font-bold mt-0.5">4:10</div>
                        </div>
                        
                        <div className="text-center p-4 rounded-xl bg-muted/30">
                          <div className="flex items-center justify-center gap-1 text-blue-600">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-current" />
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 font-medium">Clear Explanations</div>
                          <div className="text-sm font-bold mt-0.5">4:74</div>
                        </div>
                      </div>
                    </div>

                    {/* Book Appointment Card */}
                    <Card className="w-72 shadow-lg border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Book an Appointment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Time</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm">8:00 AM</Button>
                            <Button variant="outline" size="sm">10:00 AM</Button>
                            <Button variant="default" size="sm" className="col-span-2 bg-[hsl(var(--accent-yellow))] text-[hsl(var(--accent-yellow-foreground))] hover:bg-[hsl(var(--accent-yellow))]/90">
                              11:00 AM
                            </Button>
                          </div>
                        </div>
                        <Button asChild size="lg" className="w-full bg-[hsl(var(--accent-yellow))] text-[hsl(var(--accent-yellow-foreground))] hover:bg-[hsl(var(--accent-yellow))]/90 shadow-lg">
                          <Link to={`/book/${specialist.id}`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Book Now
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Summary Section */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      At Summary
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{specialist.bio}</p>
                  </div>

                  <Separator />

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">Experience</span>
                      </div>
                      <p className="text-2xl font-bold">{specialist.years_experience} years</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">Consultation Fee</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {specialist.consultation_fee_min}-{specialist.consultation_fee_max} {specialist.currency}
                      </p>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Specializations
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {specialist.sub_specialty?.map((sub) => (
                        <Badge key={sub} variant="secondary" className="px-3 py-1">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="reviews" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="reviews" className="text-base">Reviews ({specialist.total_reviews})</TabsTrigger>
              <TabsTrigger value="credentials" className="text-base">Credentials</TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="space-y-4">
              {reviews.length === 0 ? (
                <Card className="shadow-lg">
                  <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground text-lg">No reviews yet</p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {review.is_anonymous
                              ? 'Anonymous Patient'
                              : `${review.profiles?.first_name} ${review.profiles?.last_name}`}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {new Date(review.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="font-bold text-primary">{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                      {review.specialist_response && (
                        <div className="pl-4 border-l-4 border-primary/30 bg-primary/5 p-4 rounded-r-lg space-y-2">
                          <p className="text-sm font-bold text-primary">Response from Dr. {specialist.profiles?.last_name}</p>
                          <p className="text-sm text-muted-foreground">{review.specialist_response}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="credentials">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Education & Credentials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2 p-6 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Award className="h-5 w-5" />
                        <h3 className="font-bold text-lg">Medical School</h3>
                      </div>
                      <p className="text-foreground font-medium">{specialist.medical_school}</p>
                    </div>
                    
                    <div className="space-y-2 p-6 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Calendar className="h-5 w-5" />
                        <h3 className="font-bold text-lg">Graduation Year</h3>
                      </div>
                      <p className="text-foreground font-medium">{specialist.graduation_year}</p>
                    </div>
                    
                    <div className="space-y-2 p-6 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MapPin className="h-5 w-5" />
                        <h3 className="font-bold text-lg">License Country</h3>
                      </div>
                      <p className="text-foreground font-medium">{specialist.license_country}</p>
                    </div>
                    
                    <div className="space-y-2 p-6 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock className="h-5 w-5" />
                        <h3 className="font-bold text-lg">Years of Experience</h3>
                      </div>
                      <p className="text-foreground font-medium">{specialist.years_experience} years</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg">Total Consultations</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary">{specialist.total_consultations}</span>
                      <span className="text-muted-foreground">successful consultations</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
