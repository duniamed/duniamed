import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Plus, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ProviderAbsences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [absences, setAbsences] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newAbsence, setNewAbsence] = useState({
    absence_type: 'vacation',
    start_date: '',
    end_date: '',
    out_of_office_message: '',
    auto_redirect: true,
    backup_specialist_id: ''
  });

  useEffect(() => {
    loadAbsences();
  }, [user]);

  const loadAbsences = async () => {
    if (!user) return;

    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('provider_absences')
        .select(`
          *,
          backup:backup_specialist_id(
            specialty,
            user:user_id(first_name, last_name)
          )
        `)
        .eq('specialist_id', specialist.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setAbsences(data || []);
    } catch (error) {
      console.error('Error loading absences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load absences',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createAbsence = async () => {
    if (!user || !newAbsence.start_date || !newAbsence.end_date) return;

    setCreating(true);
    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) throw new Error('Specialist not found');

      const { error } = await supabase
        .from('provider_absences')
        .insert({
          specialist_id: specialist.id,
          ...newAbsence,
          start_date: new Date(newAbsence.start_date).toISOString(),
          end_date: new Date(newAbsence.end_date).toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Absence scheduled',
        description: 'Your absence has been recorded and patients will be notified.'
      });

      setNewAbsence({
        absence_type: 'vacation',
        start_date: '',
        end_date: '',
        out_of_office_message: '',
        auto_redirect: true,
        backup_specialist_id: ''
      });

      loadAbsences();
    } catch (error) {
      console.error('Error creating absence:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule absence',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const getAbsenceStatus = (absence: any) => {
    const now = new Date();
    const start = new Date(absence.start_date);
    const end = new Date(absence.end_date);

    if (now < start) return { status: 'upcoming', variant: 'default' as const };
    if (now > end) return { status: 'past', variant: 'secondary' as const };
    return { status: 'active', variant: 'destructive' as const };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Provider Absences</h1>
            <p className="text-muted-foreground mt-2">
              Manage your availability and assign backup providers
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Absence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule Provider Absence</DialogTitle>
                <DialogDescription>
                  Set up out-of-office periods and configure patient routing
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="absence-type">Absence Type</Label>
                  <Select
                    value={newAbsence.absence_type}
                    onValueChange={(value) => setNewAbsence({ ...newAbsence, absence_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="sick_leave">Sick Leave</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newAbsence.start_date}
                      onChange={(e) => setNewAbsence({ ...newAbsence, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={newAbsence.end_date}
                      onChange={(e) => setNewAbsence({ ...newAbsence, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ooo-message">Out of Office Message</Label>
                  <Textarea
                    id="ooo-message"
                    value={newAbsence.out_of_office_message}
                    onChange={(e) => setNewAbsence({ ...newAbsence, out_of_office_message: e.target.value })}
                    placeholder="I will be out of office from... Please contact Dr. Smith for urgent matters."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newAbsence.auto_redirect}
                    onCheckedChange={(checked) => setNewAbsence({ ...newAbsence, auto_redirect: checked })}
                    id="auto-redirect"
                  />
                  <Label htmlFor="auto-redirect">
                    Automatically redirect patients to backup provider
                  </Label>
                </div>
                {newAbsence.auto_redirect && (
                  <div>
                    <Label htmlFor="backup">Backup Provider ID</Label>
                    <Input
                      id="backup"
                      value={newAbsence.backup_specialist_id}
                      onChange={(e) => setNewAbsence({ ...newAbsence, backup_specialist_id: e.target.value })}
                      placeholder="Enter backup specialist ID"
                    />
                  </div>
                )}
                <Button onClick={createAbsence} disabled={creating} className="w-full">
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule Absence
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {absences.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No absences scheduled</p>
              <p className="text-sm text-muted-foreground mb-4">
                Schedule time off and configure backup providers
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {absences.map((absence) => {
              const { status, variant } = getAbsenceStatus(absence);
              return (
                <Card key={absence.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {absence.absence_type.replace('_', ' ').toUpperCase()}
                        </CardTitle>
                        <CardDescription>
                          {new Date(absence.start_date).toLocaleDateString()} - {new Date(absence.end_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={variant}>{status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {absence.out_of_office_message && (
                      <div>
                        <p className="text-sm font-medium">Out of Office Message:</p>
                        <p className="text-sm text-muted-foreground">{absence.out_of_office_message}</p>
                      </div>
                    )}
                    {absence.backup && (
                      <div className="flex items-start gap-2 bg-muted p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Backup Provider:</p>
                          <p className="text-sm text-muted-foreground">
                            {absence.backup.user?.first_name} {absence.backup.user?.last_name} ({absence.backup.specialty})
                          </p>
                        </div>
                      </div>
                    )}
                    {absence.auto_redirect && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">Auto-redirect enabled</Badge>
                        {absence.patients_notified && (
                          <Badge variant="outline">Patients notified</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
