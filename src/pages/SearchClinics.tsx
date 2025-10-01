import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, MapPin, Building2, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Clinic {
  id: string;
  name: string;
  clinic_type: 'virtual' | 'physical' | 'hybrid';
  description: string;
  specialties: string[];
  city: string;
  state: string;
  country: string;
  website: string;
  logo_url: string;
  slug: string;
  staff_count: number;
  average_rating: number;
}

export default function SearchClinics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'all');

  const clinicTypes = [
    'General Practice',
    'Specialty Clinic',
    'Hospital',
    'Urgent Care',
    'Walk-in Clinic',
    'Mental Health Center',
    'Dental Clinic',
    'Eye Care Center',
  ];

  useEffect(() => {
    fetchClinics();
  }, [searchQuery, selectedType, selectedCountry]);

  const fetchClinics = async () => {
    setLoading(true);

    let query = supabase
      .from('clinics_public')
      .select('*')
      .eq('is_active', true);

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,specialties.cs.{${searchQuery}}`);
    }

    if (selectedType !== 'all') {
      query = query.eq('clinic_type', selectedType as any);
    }

    if (selectedCountry !== 'all') {
      query = query.eq('country', selectedCountry);
    }

    const { data, error } = await query;

    if (!error && data) {
      setClinics(data as any);
    }

    setLoading(false);
  };

  const handleSearch = () => {
    const params: any = {};
    if (searchQuery) params.q = searchQuery;
    if (selectedType !== 'all') params.type = selectedType;
    if (selectedCountry !== 'all') params.country = selectedCountry;
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Find a Healthcare Clinic</h1>
            <p className="text-muted-foreground">Search for clinics and healthcare facilities</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or specialty..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Clinic Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {clinicTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="BR">Brazil</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={handleSearch} className="w-full md:w-auto">
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Search Clinics
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : clinics.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No clinics found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clinics.map((clinic) => (
                <Card key={clinic.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {clinic.logo_url ? (
                          <img src={clinic.logo_url} alt={clinic.name} className="h-full w-full object-cover rounded-lg" />
                        ) : (
                          <Building2 className="h-8 w-8" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{clinic.name}</CardTitle>
                          <Badge 
                            variant={clinic.clinic_type === 'virtual' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {clinic.clinic_type === 'virtual' ? '🌐 Virtual' : 
                             clinic.clinic_type === 'hybrid' ? '🏥 Hybrid' : '🏥 Physical'}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {clinic.clinic_type === 'virtual' 
                            ? 'Online Consultations' 
                            : `${clinic.city}, ${clinic.country}`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {clinic.specialties?.slice(0, 2).map((spec) => (
                        <Badge key={spec} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                      {clinic.staff_count > 0 && (
                        <Badge variant="outline">
                          {clinic.staff_count} {clinic.staff_count === 1 ? 'Specialist' : 'Specialists'}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {clinic.description || 'No description available'}
                    </p>

                    <div className="flex gap-2">
                      {clinic.website && (
                        <Button asChild variant="outline" size="sm">
                          <a href={clinic.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="mr-2 h-4 w-4" />
                            Website
                          </a>
                        </Button>
                      )}
                      <Button asChild className="flex-1">
                        <Link to={`/clinic/${clinic.slug}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}