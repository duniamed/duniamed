import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock,
  Star,
  Users,
  Calendar
} from 'lucide-react';
import Layout from '@/components/layout/Layout';

interface PublicClinic {
  id: string;
  name: string;
  description: string;
  clinic_type: string;
  logo_url: string | null;
  cover_image_url: string | null;
  tagline: string | null;
  mission_statement: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  specialties: string[];
  languages_supported: string[];
  operating_hours: any;
  staff_count: number;
  average_rating: number;
  slug: string;
}

export default function PublicClinicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<PublicClinic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClinicData();
  }, [slug]);

  const loadClinicData = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics_public')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setClinic(data);
    } catch (error) {
      console.error('Error loading clinic:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p>Loading clinic information...</p>
        </div>
      </Layout>
    );
  }

  if (!clinic) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <h1 className="text-2xl font-bold">Clinic Not Found</h1>
          <Button onClick={() => navigate('/search-clinics')}>
            Browse All Clinics
          </Button>
        </div>
      </Layout>
    );
  }

  const fullAddress = [
    clinic.address_line1,
    clinic.city,
    clinic.state,
    clinic.country,
    clinic.postal_code
  ].filter(Boolean).join(', ');

  return (
    <>
      <Helmet>
        <title>{clinic.name} | DuniaMed Global Healthcare</title>
        <meta name="description" content={clinic.description || clinic.tagline || `${clinic.name} - Healthcare services`} />
        <meta property="og:title" content={clinic.name} />
        <meta property="og:description" content={clinic.description || clinic.tagline || ''} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://duniamed.com/clinic/${slug}`} />
      </Helmet>

      <Layout>
        <div className="min-h-screen">
          {/* Cover Image */}
          {clinic.cover_image_url && (
            <div className="h-64 w-full overflow-hidden">
              <img 
                src={clinic.cover_image_url} 
                alt={`${clinic.name} cover`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-start gap-6 mb-8">
              {clinic.logo_url && (
                <img 
                  src={clinic.logo_url} 
                  alt={`${clinic.name} logo`}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{clinic.name}</h1>
                  <Badge 
                    variant={clinic.clinic_type === 'virtual' ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {clinic.clinic_type === 'virtual' ? '🌐 Virtual Clinic' : 
                     clinic.clinic_type === 'hybrid' ? '🏥 Hybrid Clinic' : '🏥 Physical Clinic'}
                  </Badge>
                </div>
                {clinic.tagline && (
                  <p className="text-lg text-muted-foreground mb-3">{clinic.tagline}</p>
                )}
                <div className="flex items-center gap-4 flex-wrap">
                  {clinic.clinic_type === 'virtual' && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Online Consultations Available
                    </Badge>
                  )}
                  {clinic.clinic_type === 'hybrid' && (
                    <>
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        In-Person Visits
                      </Badge>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Virtual Consultations
                      </Badge>
                    </>
                  )}
                  {clinic.average_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{clinic.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                  {clinic.staff_count > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{clinic.staff_count} healthcare professionals</span>
                    </div>
                  )}
                </div>
              </div>
              <Button size="lg" onClick={() => navigate('/book-appointment')}>
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* About */}
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-bold mb-4">About Us</h2>
                    {clinic.description && (
                      <p className="text-muted-foreground mb-4">{clinic.description}</p>
                    )}
                    {clinic.mission_statement && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">Our Mission</h3>
                        <p className="text-sm">{clinic.mission_statement}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Specialties */}
                {clinic.specialties && clinic.specialties.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <h2 className="text-2xl font-bold mb-4">Specialties</h2>
                      <div className="flex flex-wrap gap-2">
                        {clinic.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline">{specialty}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Languages */}
                {clinic.languages_supported && clinic.languages_supported.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <h2 className="text-2xl font-bold mb-4">Languages Spoken</h2>
                      <div className="flex flex-wrap gap-2">
                        {clinic.languages_supported.map((lang, index) => (
                          <Badge key={index} variant="secondary">{lang}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-bold mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      {clinic.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${clinic.phone}`} className="text-sm hover:underline">
                            {clinic.phone}
                          </a>
                        </div>
                      )}
                      {clinic.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${clinic.email}`} className="text-sm hover:underline">
                            {clinic.email}
                          </a>
                        </div>
                      )}
                      {clinic.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={clinic.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm hover:underline"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                      {fullAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-sm">{fullAddress}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Operating Hours */}
                {clinic.operating_hours && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-4 w-4" />
                        <h3 className="font-bold">Operating Hours</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        {Object.entries(clinic.operating_hours).map(([day, hours]: [string, any]) => (
                          <div key={day} className="flex justify-between">
                            <span className="capitalize">{day}</span>
                            <span className="text-muted-foreground">
                              {hours.open} - {hours.close}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
