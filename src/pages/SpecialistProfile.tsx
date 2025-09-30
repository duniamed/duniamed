import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, MapPin, Calendar, DollarSign, Award, Languages, Clock } from 'lucide-react';

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
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <SpecialistProfileContent />
    </ProtectedRoute>
  );
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 px-4 mt-16">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Specialist not found</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl">
                    {specialist.profiles?.first_name?.[0]}
                    {specialist.profiles?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div>
                    <h1 className="text-3xl font-bold">
                      Dr. {specialist.profiles?.first_name} {specialist.profiles?.last_name}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {specialist.profiles?.city}, {specialist.profiles?.country}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {specialist.specialty.map((spec) => (
                      <Badge key={spec}>{spec}</Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium">{specialist.average_rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">
                        ({specialist.total_reviews} reviews)
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{specialist.years_experience} years experience</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {specialist.consultation_fee_min}-{specialist.consultation_fee_max}{' '}
                        {specialist.currency}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button asChild size="lg">
                    <Link to={`/book/${specialist.id}`}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Appointment
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" disabled>
                    Message
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="about">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{specialist.bio}</p>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <Languages className="h-4 w-4" />
                        Languages
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {specialist.languages.map((lang) => (
                          <Badge key={lang} variant="outline">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4" />
                        Specializations
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {specialist.sub_specialty?.map((sub) => (
                          <Badge key={sub} variant="outline">
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Consultations:</span>
                      <span className="font-medium">{specialist.total_consultations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">License Country:</span>
                      <span className="font-medium">{specialist.license_country}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No reviews yet</p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {review.is_anonymous
                              ? 'Anonymous'
                              : `${review.profiles?.first_name} ${review.profiles?.last_name}`}
                          </CardTitle>
                          <CardDescription>
                            {new Date(review.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-primary text-primary'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{review.comment}</p>
                      {review.specialist_response && (
                        <div className="pl-4 border-l-2 space-y-1">
                          <p className="text-sm font-semibold">Response from Dr. {specialist.profiles?.last_name}</p>
                          <p className="text-sm text-muted-foreground">{review.specialist_response}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="credentials">
              <Card>
                <CardHeader>
                  <CardTitle>Education & Credentials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Medical School</h3>
                    <p className="text-muted-foreground">{specialist.medical_school}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold">Graduation Year</h3>
                    <p className="text-muted-foreground">{specialist.graduation_year}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold">License Country</h3>
                    <p className="text-muted-foreground">{specialist.license_country}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold">Years of Experience</h3>
                    <p className="text-muted-foreground">{specialist.years_experience} years</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
