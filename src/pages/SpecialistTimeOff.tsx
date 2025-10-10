import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface TimeOff {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  created_at: string;
}

export default function SpecialistTimeOff() {
  return (
    <ProtectedRoute allowedRoles={['specialist']}>
      <TimeOffContent />
    </ProtectedRoute>
  );
}

function TimeOffContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    fetchSpecialistData();
  }, [user]);

  const fetchSpecialistData = async () => {
    if (!user) return;

    const { data: specialistData } = await supabase
      .from('specialists')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (specialistData) {
      setSpecialistId(specialistData.id);
      fetchTimeOffs(specialistData.id);
    }
    setLoading(false);
  };

  const fetchTimeOffs = async (specId: string) => {
    const { data, error } = await supabase
      .from('specialist_time_off')
      .select('*')
      .eq('specialist_id', specId)
      .order('start_date', { ascending: false });

    if (!error && data) {
      setTimeOffs(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!specialistId) return;

    try {
      const { error } = await supabase.from('specialist_time_off').insert({
        specialist_id: specialistId,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason || null,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Time off added successfully',
      });

      setFormData({
        start_date: '',
        end_date: '',
        reason: '',
      });
      setShowAddForm(false);
      fetchTimeOffs(specialistId);
    } catch (error) {
      console.error('Error adding time off:', error);
      toast({
        title: 'Error',
        description: 'Failed to add time off',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('specialist_time_off')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Time off removed',
      });

      if (specialistId) fetchTimeOffs(specialistId);
    } catch (error) {
      console.error('Error deleting time off:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove time off',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Time Off Management"
      description="Manage your unavailable dates and block times"
    >
      <div className="flex items-center justify-end mb-6">
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Time Off
        </Button>
      </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add Time Off</CardTitle>
              <CardDescription>Block dates when you're unavailable</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="E.g., Vacation, Conference, Personal"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Time Off</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {timeOffs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No time off scheduled</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Off
                </Button>
              </CardContent>
            </Card>
          ) : (
            timeOffs.map((timeOff) => (
              <Card key={timeOff.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">
                          {new Date(timeOff.start_date).toLocaleDateString()} -{' '}
                          {new Date(timeOff.end_date).toLocaleDateString()}
                        </CardTitle>
                        {timeOff.reason && (
                          <CardDescription>{timeOff.reason}</CardDescription>
                        )}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Time Off?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this time off period?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(timeOff.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
    </DashboardLayout>
  );
}
