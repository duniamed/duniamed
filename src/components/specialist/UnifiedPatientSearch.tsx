import { useState, useCallback, useEffect } from 'react';
import { Search, User, Calendar, Pill, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface PatientSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  avatar_url?: string;
  identifier?: {
    type: string;
    value: string;
    verified: boolean;
  };
  medicalSummary: {
    current_medications: any[];
    allergies: any[];
    chronic_conditions: any[];
    total_appointments: number;
    has_active_prescriptions: boolean;
  };
  stats: {
    totalAppointments: number;
    activePrescriptions: number;
    lastVisit: string | null;
    lastComplaint: string | null;
  };
  insurance: {
    provider: string;
    status: string;
    verified: boolean;
  } | null;
}

interface UnifiedPatientSearchProps {
  onSelectPatient: (patientId: string) => void;
}

export function UnifiedPatientSearch({ onSelectPatient }: UnifiedPatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'identifier'>('name');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const { toast } = useToast();

  const performSearch = useCallback(async (query: string, type: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('unified-patient-search', {
        body: { query, searchType: type }
      });

      if (error) throw error;

      if (data?.success) {
        setResults(data.patients || []);
      } else {
        throw new Error(data?.error || 'Search failed');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Unable to search patients",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery, searchType);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType, performSearch]);

  const getInsuranceStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'verified':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'expired':
      case 'inactive':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Patient Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={searchType} onValueChange={(v) => setSearchType(v as 'name' | 'identifier')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="name">Search by Name</TabsTrigger>
              <TabsTrigger value="identifier">Search by ID (CPF/SSN/NHS)</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchType === 'name' ? "Enter patient name or email..." : "Enter CPF, SSN, NHS number..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isSearching && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          )}

          {!isSearching && results.length === 0 && searchQuery.length >= 2 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No patients found matching "{searchQuery}"</p>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {results.map((patient) => (
                <Card
                  key={patient.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => onSelectPatient(patient.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={patient.avatar_url} />
                        <AvatarFallback>
                          {patient.first_name?.[0]}{patient.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {patient.first_name} {patient.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {patient.email}
                              {patient.date_of_birth && (
                                <span className="ml-2">• Age {calculateAge(patient.date_of_birth)}</span>
                              )}
                            </p>
                          </div>
                          {patient.identifier && (
                            <Badge variant={patient.identifier.verified ? "default" : "secondary"}>
                              {patient.identifier.type.toUpperCase()}: {patient.identifier.value}
                              {patient.identifier.verified && (
                                <CheckCircle className="ml-1 h-3 w-3" />
                              )}
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{patient.stats.totalAppointments} visits</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Pill className="h-4 w-4 text-muted-foreground" />
                            <span>{patient.stats.activePrescriptions} active Rx</span>
                          </div>
                        </div>

                        {patient.medicalSummary.allergies.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {patient.medicalSummary.allergies.slice(0, 3).map((allergy: any, idx: number) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {typeof allergy === 'string' ? allergy : allergy.name}
                              </Badge>
                            ))}
                            {patient.medicalSummary.allergies.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{patient.medicalSummary.allergies.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {patient.insurance && (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <Badge className={getInsuranceStatusColor(patient.insurance.status)}>
                              {patient.insurance.provider} - {patient.insurance.status}
                            </Badge>
                          </div>
                        )}

                        {patient.stats.lastVisit && (
                          <p className="text-xs text-muted-foreground">
                            Last visit: {new Date(patient.stats.lastVisit).toLocaleDateString()}
                            {patient.stats.lastComplaint && ` - ${patient.stats.lastComplaint}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}