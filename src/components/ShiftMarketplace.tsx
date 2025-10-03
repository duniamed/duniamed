import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, DollarSign, MapPin, Star, Briefcase, Video, Building } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ShiftMarketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shifts, setShifts] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  
  // Filters
  const [specialty, setSpecialty] = useState('');
  const [modality, setModality] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');

  useEffect(() => {
    if (user) {
      loadShifts();
      loadApplications();
      loadAssignments();
    }
  }, [user, specialty, modality, dateFrom]);

  // Real-time subscriptions for shift updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('shift-marketplace-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_listings'
        },
        (payload) => {
          console.log('Shift listing changed:', payload);
          loadShifts(); // Refresh shifts when any change occurs
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_applications'
        },
        (payload) => {
          console.log('Shift application changed:', payload);
          loadApplications();
          loadAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('find-shifts', {
        body: { specialty, modality, date_from: dateFrom }
      });

      if (error) throw error;
      setShifts(data.shifts || []);
    } catch (error: any) {
      console.error('Load shifts error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available shifts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (specialist) {
        const { data, error } = await (supabase as any)
          .from('shift_applications')
          .select(`
            *,
            shift_listing:shift_listings(
              *,
              clinic:clinics(name, logo_url)
            )
          `)
          .eq('specialist_id', specialist.id)
          .order('applied_at', { ascending: false });

        if (error) throw error;
        setMyApplications(data || []);
      }
    } catch (error: any) {
      console.error('Load applications error:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (specialist) {
        const { data, error } = await (supabase as any)
          .from('shift_assignments')
          .select(`
            *,
            shift_listing:shift_listings(
              *,
              clinic:clinics(name, logo_url, city, state),
              location:clinic_locations(location_name, address_line1)
            )
          `)
          .eq('specialist_id', specialist.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMyAssignments(data || []);
      }
    } catch (error: any) {
      console.error('Load assignments error:', error);
    }
  };

  const handleApply = async (shiftId: string) => {
    try {
      setApplying(shiftId);
      
      const { data, error } = await supabase.functions.invoke('apply-to-shift', {
        body: {
          shift_listing_id: shiftId,
          cover_message: 'I am interested in this shift opportunity.'
        }
      });

      if (error) throw error;

      toast({
        title: data.auto_approved ? '✅ Shift Confirmed!' : '📨 Application Submitted',
        description: data.message
      });

      loadShifts();
      loadApplications();
      if (data.auto_approved) loadAssignments();
    } catch (error: any) {
      toast({
        title: 'Application Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setApplying(null);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'destructive';
      case 'urgent': return 'default';
      default: return 'secondary';
    }
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'telemedicine': return <Video className="h-4 w-4" />;
      case 'presencial': return <Building className="h-4 w-4" />;
      case 'hybrid': return <Briefcase className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">International Shift Marketplace</h1>
        <p className="text-muted-foreground">
          Find and apply to shifts worldwide • Instant payments • Verified credentials
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Specialty</label>
            <Input
              placeholder="e.g., Cardiology"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Modality</label>
            <Select value={modality} onValueChange={setModality}>
              <SelectTrigger>
                <SelectValue placeholder="All modalities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="telemedicine">Telemedicine</SelectItem>
                <SelectItem value="presencial">In-Person</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Date From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="available">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Available Shifts</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="assignments">Confirmed Shifts</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading shifts...</div>
          ) : shifts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No shifts match your criteria</p>
              </CardContent>
            </Card>
          ) : (
            shifts.map((shift) => (
              <Card key={shift.id} className={shift.match_score >= 80 ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {shift.clinic.logo_url && (
                        <img src={shift.clinic.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <CardTitle>{shift.clinic.name}</CardTitle>
                        <CardDescription>
                          {shift.specialty_required.join(', ')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={getUrgencyColor(shift.urgency_level)}>
                        {shift.urgency_level}
                      </Badge>
                      {shift.match_score >= 80 && (
                        <Badge variant="default">
                          <Star className="h-3 w-3 mr-1" />
                          {shift.match_score}% Match
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(shift.shift_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{shift.start_time} - {shift.end_time} ({shift.duration_minutes} min)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getModalityIcon(shift.modality)}
                      <span className="capitalize">{shift.modality}</span>
                    </div>
                    {shift.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{shift.location.city}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {shift.pay_currency} {shift.pay_rate} ({shift.pay_structure})
                      </span>
                    </div>
                  </div>
                  
                  {shift.description && (
                    <p className="text-sm text-muted-foreground">{shift.description}</p>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => handleApply(shift.id)}
                    disabled={applying === shift.id || !shift.eligible}
                  >
                    {applying === shift.id ? 'Applying...' : shift.eligible ? 'Apply Now' : 'Not Eligible'}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {myApplications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No applications yet</p>
              </CardContent>
            </Card>
          ) : (
            myApplications.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{app.shift_listing.clinic.name}</CardTitle>
                    <Badge variant={
                      app.application_status === 'approved' || app.application_status === 'auto_approved' ? 'default' :
                      app.application_status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {app.application_status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Applied {new Date(app.applied_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p><strong>Shift Date:</strong> {new Date(app.shift_listing.shift_date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {app.shift_listing.start_time} - {app.shift_listing.end_time}</p>
                    <p><strong>Match Score:</strong> {app.match_score}%</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {myAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No confirmed shifts yet</p>
              </CardContent>
            </Card>
          ) : (
            myAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{assignment.shift_listing.clinic.name}</CardTitle>
                    <Badge>{assignment.status}</Badge>
                  </div>
                  <CardDescription>
                    {assignment.shift_listing.location?.location_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <p><strong>Date:</strong> {new Date(assignment.shift_listing.shift_date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {assignment.shift_listing.start_time} - {assignment.shift_listing.end_time}</p>
                    <p><strong>Payment:</strong> {assignment.currency} {assignment.amount_due}</p>
                    <p><strong>Status:</strong> {assignment.payment_status}</p>
                  </div>
                  
                  {assignment.status === 'completed' && !assignment.clinic_rated_specialist && (
                    <Button variant="outline" className="w-full">
                      Rate This Shift
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}