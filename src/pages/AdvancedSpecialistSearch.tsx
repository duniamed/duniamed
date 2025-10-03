import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Star, Calendar, Navigation, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function AdvancedSpecialistSearch() {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchCriteria, setSearchCriteria] = useState({
    specialty: "",
    zipCode: "",
    maxDistance: 10,
    languages: [] as string[],
    insurance: "",
  });

  const handleSearch = async (relaxedConstraints?: any) => {
    setSearching(true);
    try {
      // Geocode patient's ZIP code
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${searchCriteria.zipCode}&country=US&format=json&limit=1`
      );
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData || geocodeData.length === 0) {
        throw new Error("Invalid ZIP code");
      }

      const patientLocation = {
        latitude: parseFloat(geocodeData[0].lat),
        longitude: parseFloat(geocodeData[0].lon),
      };

      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      const { data, error } = await supabase.functions.invoke("constraint-search", {
        body: {
          specialty: relaxedConstraints?.specialty || searchCriteria.specialty,
          patientLocation,
          maxDistance: relaxedConstraints?.maxDistance || searchCriteria.maxDistance,
          languages: relaxedConstraints?.languages || searchCriteria.languages,
          insuranceId: searchCriteria.insurance,
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      if (error) throw error;

      setResults(data.results || []);
      setSuggestions(data.suggestions || []);

      if (data.results.length === 0 && data.suggestions.length === 0) {
        toast({
          title: "No Results",
          description: "No specialists found matching your criteria. Try adjusting your search.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleRelaxConstraint = (suggestion: any) => {
    if (suggestion.type === "expand_distance") {
      handleSearch({ ...searchCriteria, maxDistance: 25 });
    } else if (suggestion.type === "remove_language") {
      handleSearch({ ...searchCriteria, languages: [] });
    }
  };

  const handleBook = (specialistId: string) => {
    navigate(`/book/${specialistId}`);
  };

  return (
    <DashboardLayout title="Find a Specialist">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
            <CardDescription>
              Enter your preferences to find the best matching specialists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialty">Specialty</Label>
                  <Select
                    value={searchCriteria.specialty}
                    onValueChange={(value) =>
                      setSearchCriteria({ ...searchCriteria, specialty: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cardiology">Cardiology</SelectItem>
                      <SelectItem value="Dermatology">Dermatology</SelectItem>
                      <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                      <SelectItem value="Gastroenterology">Gastroenterology</SelectItem>
                      <SelectItem value="Neurology">Neurology</SelectItem>
                      <SelectItem value="Oncology">Oncology</SelectItem>
                      <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                      <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="zipCode">Your ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={searchCriteria.zipCode}
                    onChange={(e) =>
                      setSearchCriteria({ ...searchCriteria, zipCode: e.target.value })
                    }
                    placeholder="e.g., 02134"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="maxDistance">Max Distance (miles)</Label>
                  <Select
                    value={String(searchCriteria.maxDistance)}
                    onValueChange={(value) =>
                      setSearchCriteria({
                        ...searchCriteria,
                        maxDistance: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 miles</SelectItem>
                      <SelectItem value="10">10 miles</SelectItem>
                      <SelectItem value="25">25 miles</SelectItem>
                      <SelectItem value="50">50 miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="insurance">Insurance (optional)</Label>
                  <Input
                    id="insurance"
                    value={searchCriteria.insurance}
                    onChange={(e) =>
                      setSearchCriteria({ ...searchCriteria, insurance: e.target.value })
                    }
                    placeholder="e.g., Blue Cross Blue Shield"
                  />
                </div>
              </div>

              <Button type="submit" disabled={searching} className="w-full">
                {searching ? "Searching..." : "Search Specialists"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {suggestions.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertCircle className="w-5 h-5" />
                No Exact Matches Found
              </CardTitle>
              <CardDescription className="text-orange-700">
                Try relaxing some constraints to find more options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                  >
                    <p className="text-sm">{suggestion.message}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRelaxConstraint(suggestion)}
                    >
                      Try This
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.specialist_id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{result.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{result.clinic_name}</span>
                        <Badge variant="outline">{result.distance_miles} miles</Badge>
                      </div>

                      {result.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{result.rating}</span>
                          <span className="text-muted-foreground">
                            ({result.review_count} reviews)
                          </span>
                        </div>
                      )}

                      {result.next_available ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">
                            Next available:{" "}
                            {new Date(result.next_available).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Calendar className="w-4 h-4" />
                          <span>No availability in next 90 days</span>
                        </div>
                      )}

                      {result.languages && result.languages.length > 0 && (
                        <div className="flex gap-1">
                          {result.languages.map((lang: string) => (
                            <Badge key={lang} variant="secondary">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleBook(result.specialist_id)}
                      disabled={!result.next_available}
                    >
                      Book Appointment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/specialists/${result.specialist_id}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length === 0 && !searching && suggestions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Navigation className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Enter search criteria above to find specialists near you
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
