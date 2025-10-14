import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, Calendar } from 'lucide-react';

export const MultiClinicRouter = ({ patientId }: { patientId: string }) => {
  const [specialty, setSpecialty] = useState('');
  const [routing, setRouting] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const findBestClinic = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-clinic-routing', {
        body: {
          patientId,
          specialty,
          urgency: 'routine',
          location: { lat: 0, lng: 0 }
        }
      });
      
      if (error) throw error;
      setRouting(data.routing);
      toast({ title: 'Best clinic found', description: data.routing.reason });
    } catch (error: any) {
      toast({ title: 'Routing failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Best Clinic</CardTitle>
        <CardDescription>AI-powered multi-clinic routing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger>
            <SelectValue placeholder="Select specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cardiology">Cardiology</SelectItem>
            <SelectItem value="dermatology">Dermatology</SelectItem>
            <SelectItem value="orthopedics">Orthopedics</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={findBestClinic} disabled={!specialty || loading} className="w-full">
          <Building2 className="mr-2 h-4 w-4" />
          {loading ? 'Finding...' : 'Find Best Clinic'}
        </Button>

        {routing && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">Recommended Clinic</span>
            </div>
            <p className="text-sm text-muted-foreground">{routing.reason}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>Specialist ID: {routing.specialist_id}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Wait: {routing.estimated_wait}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
