import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, User, Calendar, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  patient_number?: string;
  last_appointment?: string;
  appointment_count?: number;
  date_of_birth?: string;
}

export default function SpecialistPatients() {
  return (
    <ProtectedRoute>
      <SpecialistPatientsContent />
    </ProtectedRoute>
  );
}

function SpecialistPatientsContent() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      fetchPatients();
    }
  }, [profile]);

  const fetchPatients = async () => {
    try {
      // Get specialist ID
      const { data: specialistData } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', profile?.id)
        .single();

      if (!specialistData) {
        setLoading(false);
        return;
      }

      // Get distinct patients from appointments
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          scheduled_at,
          profiles!appointments_patient_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone,
            patient_number,
            date_of_birth
          )
        `)
        .eq('specialist_id', specialistData.id)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;

      // Group by patient and get appointment counts
      const patientMap = new Map<string, Patient>();
      
      appointmentsData?.forEach((apt: any) => {
        const profile = apt.profiles;
        if (!profile) return;

        if (!patientMap.has(profile.id)) {
          patientMap.set(profile.id, {
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            phone: profile.phone,
            patient_number: profile.patient_number,
            last_appointment: apt.scheduled_at,
            appointment_count: 1,
          });
        } else {
          const existing = patientMap.get(profile.id)!;
          existing.appointment_count = (existing.appointment_count || 0) + 1;
        }
      });

      setPatients(Array.from(patientMap.values()));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.first_name?.toLowerCase().includes(searchLower) ||
      patient.last_name?.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.patient_number?.toLowerCase().includes(searchLower) ||
      patient.phone?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout
      title="My Patients"
      description="View and manage your patient list"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or patient ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => navigate('/specialist/create-patient')}>
            <User className="mr-2 h-4 w-4" />
            Create Patient
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">{patients.length}</div>
            <div className="text-sm text-muted-foreground">Total Patients</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">
              {patients.filter(p => {
                const lastAppt = p.last_appointment ? new Date(p.last_appointment) : null;
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return lastAppt && lastAppt >= thirtyDaysAgo;
              }).length}
            </div>
            <div className="text-sm text-muted-foreground">Active (Last 30 days)</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">
              {patients.reduce((sum, p) => sum + (p.appointment_count || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Appointments</div>
          </Card>
        </div>

        {/* Patient List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading patients...</div>
        ) : filteredPatients.length === 0 ? (
          <Card className="p-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No patients found matching your search' : 'No patients yet'}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {patient.patient_number ? `ID: ${patient.patient_number}` : 'No patient ID assigned'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{patient.email}</span>
                      </div>
                      {patient.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                      {patient.last_appointment && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Last visit: {new Date(patient.last_appointment).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="text-muted-foreground">
                        {patient.appointment_count} {patient.appointment_count === 1 ? 'appointment' : 'appointments'}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => navigate(`/patient/${patient.id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
