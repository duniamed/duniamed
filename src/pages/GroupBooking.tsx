import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, X, Calendar, Clock } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  relationship: string;
}

export default function GroupBooking() {
  const [members, setMembers] = useState<FamilyMember[]>([
    { id: crypto.randomUUID(), name: "", age: 0, relationship: "child" },
  ]);
  const [specialty, setSpecialty] = useState("");
  const [preferredDay, setPreferredDay] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const addMember = () => {
    setMembers([
      ...members,
      { id: crypto.randomUUID(), name: "", age: 0, relationship: "child" },
    ]);
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const updateMember = (id: string, field: keyof FamilyMember, value: any) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const searchGroupSlots = async () => {
    if (!specialty || members.some((m) => !m.name || m.age === 0)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all family member details",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    toast({
      title: "Searching...",
      description: `Finding ${members.length} consecutive slots for your family`,
    });

    try {
      const { data, error } = await supabase.functions.invoke('coordinate-group-booking', {
        body: {
          action: 'find_consecutive_slots',
          session_data: {
            specialty,
            preferred_date: preferredDay,
            member_count: members.length
          }
        }
      });

      if (error) throw error;

      if (data.success && data.consecutive_slots) {
        setResults(data.consecutive_slots.map((slot: any) => ({
          practitioner: `Specialist ${slot.specialist_id.substring(0, 8)}`,
          date: new Date(slot.date).toLocaleDateString(),
          slots: slot.available_slots.slice(0, members.length),
          location: "Available",
          specialist_id: slot.specialist_id
        })));
      }
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const bookGroupAppointments = async (result: any) => {
    try {
      // First create session
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('coordinate-group-booking', {
        body: {
          action: 'create_session',
          session_data: {
            session_name: `Group booking for ${members.length} members`,
            specialty,
            preferred_date: result.date,
            members: members.map(m => ({
              name: m.name,
              age: m.age,
              relationship: m.relationship
            }))
          }
        }
      });

      if (sessionError) throw sessionError;

      // Then confirm booking
      const { data: bookingData, error: bookingError } = await supabase.functions.invoke('coordinate-group-booking', {
        body: {
          action: 'confirm_booking',
          session_id: sessionData.session.id,
          slot_selection: {
            specialist_id: result.specialist_id,
            date: result.date,
            times: result.slots
          }
        }
      });

      if (bookingError) throw bookingError;

      toast({
        title: "Success!",
        description: `${bookingData.appointment_ids.length} appointments booked`,
      });

      // Reset form
      setResults([]);
      setMembers([{ id: crypto.randomUUID(), name: "", age: 0, relationship: "child" }]);
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Group Booking">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Book for Multiple Family Members
            </CardTitle>
            <CardDescription>
              Find consecutive appointment slots to minimize disruption
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Family Members */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Family Members</Label>
                <Button variant="outline" size="sm" onClick={addMember}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>

              {members.map((member, index) => (
                <Card key={member.id} className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <Label>Name</Label>
                        <Input
                          value={member.name}
                          onChange={(e) =>
                            updateMember(member.id, "name", e.target.value)
                          }
                          placeholder="Full name"
                        />
                      </div>

                      <div>
                        <Label>Age</Label>
                        <Input
                          type="number"
                          value={member.age || ""}
                          onChange={(e) =>
                            updateMember(member.id, "age", parseInt(e.target.value))
                          }
                          placeholder="Age"
                        />
                      </div>

                      <div>
                        <Label>Relationship</Label>
                        <div className="flex gap-2">
                          <Select
                            value={member.relationship}
                            onValueChange={(value) =>
                              updateMember(member.id, "relationship", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {members.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMember(member.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Search Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Specialty</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="Family Medicine">Family Medicine</SelectItem>
                    <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Preferred Day</Label>
                <Select value={preferredDay} onValueChange={setPreferredDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={searchGroupSlots}
              disabled={searching}
              className="w-full"
              size="lg"
            >
              {searching ? "Searching..." : `Find ${members.length} Consecutive Slots`}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div>
                        <h3 className="font-semibold text-lg">{result.practitioner}</h3>
                        <p className="text-sm text-muted-foreground">{result.location}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{result.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div className="flex gap-1">
                            {result.slots.map((slot: string) => (
                              <Badge key={slot} variant="secondary">
                                {slot}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">
                          {members.length} consecutive slots available
                        </span>
                      </div>
                    </div>

                    <Button onClick={() => bookGroupAppointments(result)}>
                      Book All {members.length} Appointments
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
