import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, MapPin, Star, Calendar, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MEDICAL_SPECIALTIES } from '@/lib/constants/specialties';

interface Specialist {
  id: string;
  user_id: string;
  specialty: string[];
  sub_specialty: string[];
  bio: string;
  languages: string[];
  years_experience: number;
  average_rating: number;
  total_reviews: number;
  consultation_fee_min: number;
  consultation_fee_max: number;
  currency: string;
  is_accepting_patients: boolean;
  verification_status: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    country: string;
    city: string;
  };
}

export default function Search() {
  return <SearchContent />;
}

function SearchContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || 'all');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('language') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [minFee, setMinFee] = useState(searchParams.get('minFee') || '');
  const [maxFee, setMaxFee] = useState(searchParams.get('maxFee') || '');

  const specialties = MEDICAL_SPECIALTIES;

  const languages = ['English', 'Spanish', 'Portuguese', 'French', 'German'];

  useEffect(() => {
    fetchSpecialists();
  }, [searchQuery, selectedSpecialty, selectedLanguage, sortBy, minFee, maxFee]);

  const fetchSpecialists = async () => {
    setLoading(true);
    
    let query = supabase
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
      .eq('verification_status', 'verified')
      .eq('is_accepting_patients', true);

    if (searchQuery) {
      query = query.or(`bio.ilike.%${searchQuery}%,specialty.cs.{${searchQuery}}`);
    }

    if (selectedSpecialty !== 'all') {
      query = query.contains('specialty', [selectedSpecialty]);
    }

    if (selectedLanguage !== 'all') {
      query = query.contains('languages', [selectedLanguage]);
    }

    if (minFee) {
      query = query.gte('consultation_fee_min', parseFloat(minFee));
    }

    if (maxFee) {
      query = query.lte('consultation_fee_max', parseFloat(maxFee));
    }

    if (sortBy === 'rating') {
      query = query.order('average_rating', { ascending: false });
    } else if (sortBy === 'price_low') {
      query = query.order('consultation_fee_min', { ascending: true });
    } else if (sortBy === 'price_high') {
      query = query.order('consultation_fee_min', { ascending: false });
    } else if (sortBy === 'experience') {
      query = query.order('years_experience', { ascending: false });
    }

    const { data, error } = await query;

    if (!error && data) {
      setSpecialists(data as any);
    }

    setLoading(false);
  };

  const handleSearch = () => {
    const params: any = {};
    if (searchQuery) params.q = searchQuery;
    if (selectedSpecialty !== 'all') params.specialty = selectedSpecialty;
    if (selectedLanguage !== 'all') params.language = selectedLanguage;
    if (sortBy !== 'rating') params.sort = sortBy;
    if (minFee) params.minFee = minFee;
    if (maxFee) params.maxFee = maxFee;
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <div className="space-y-8">
          {/* Header with Loss Aversion */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {specialists.length} specialists available now
                </span>
              </div>
              <Badge className="urgency-badge border-0">
                <SearchIcon className="h-3.5 w-3.5" />
                Average booking time: &lt;2 minutes
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Don't wait - Find your specialist now</h1>
            <p className="text-lg text-muted-foreground">Connect with verified specialists before your condition worsens. Most available for immediate consultation.</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
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
                  <label className="text-sm font-medium">Specialty</label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      {languages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                      <SelectItem value="experience">Most Experience</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Fee ($)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minFee}
                    onChange={(e) => setMinFee(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Fee ($)</label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={maxFee}
                    onChange={(e) => setMaxFee(e.target.value)}
                  />
                </div>

                <div className="flex items-end md:col-span-2">
                  <Button onClick={handleSearch} className="w-full">
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : specialists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No specialists found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {specialists.map((specialist) => (
                <Card key={specialist.id} className="benefit-card hover:shadow-xl transition-all border-2 hover:border-primary/30 group">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20">
                          {specialist.profiles?.first_name?.[0]}
                          {specialist.profiles?.last_name?.[0]}
                        </div>
                        {specialist.is_accepting_patients && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          Dr. {specialist.profiles?.first_name} {specialist.profiles?.last_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3" />
                          {specialist.profiles?.city}, {specialist.profiles?.country}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Specialties */}
                    <div className="flex flex-wrap gap-2">
                      {specialist.specialty.slice(0, 2).map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-muted-foreground line-clamp-2">{specialist.bio}</p>

                    {/* Stats with Social Proof */}
                    <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-semibold">{specialist.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground text-xs">
                          ({specialist.total_reviews}+)
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {specialist.years_experience}+ years exp
                      </div>
                    </div>

                    {/* Price Anchoring */}
                    <div className="bg-primary/5 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Consultation fee</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {specialist.currency} {specialist.consultation_fee_min}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          ${specialist.consultation_fee_min * 3}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">vs. in-person visit</p>
                    </div>

                    {/* Scarcity Indicator */}
                    {specialist.is_accepting_patients && (
                      <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-500 bg-yellow-500/10 rounded px-3 py-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        <span className="font-medium">Taking patients - Book before slots fill</span>
                      </div>
                    )}

                    {/* CTAs */}
                    <div className="flex gap-2 pt-2">
                      <Button asChild variant="outline" className="flex-1">
                        <Link to={`/specialist/${specialist.id}`}>Profile</Link>
                      </Button>
                      <Button asChild className="flex-1 shadow-sm">
                        <Link to={`/book/${specialist.id}`}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Book Now
                        </Link>
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
