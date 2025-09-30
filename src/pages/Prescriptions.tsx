import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Pill, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  status: string;
  created_at: string;
  expires_at: string;
  instructions: string;
  refills_remaining: number;
  specialist_id: string;
  specialists: {
    user_id: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function Prescriptions() {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <PrescriptionsContent />
    </ProtectedRoute>
  );
}

function PrescriptionsContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  const fetchPrescriptions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        specialists (
          user_id,
          profiles:user_id (
            first_name,
            last_name
          )
        )
      `)
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPrescriptions(data as any);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'expired':
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const filterPrescriptions = (status: 'active' | 'expired' | 'all') => {
    if (status === 'all') return prescriptions;
    return prescriptions.filter(p => p.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const PrescriptionCard = ({ prescription }: { prescription: Prescription }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{prescription.medication_name}</CardTitle>
              <CardDescription>
                Prescribed by Dr. {prescription.specialists.profiles.first_name}{' '}
                {prescription.specialists.profiles.last_name}
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(prescription.status)}>
            {prescription.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Dosage</p>
            <p className="font-medium">{prescription.dosage}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Frequency</p>
            <p className="font-medium">{prescription.frequency}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Duration</p>
            <p className="font-medium">{prescription.duration_days} days</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Refills Remaining</p>
            <p className="font-medium">{prescription.refills_remaining}</p>
          </div>
        </div>

        {prescription.instructions && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Instructions</p>
            <p className="text-sm">{prescription.instructions}</p>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Prescribed on {new Date(prescription.created_at).toLocaleDateString()}</span>
          {prescription.expires_at && (
            <span>• Expires {new Date(prescription.expires_at).toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <h1 className="text-3xl font-bold mb-6">My Prescriptions</h1>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {filterPrescriptions('active').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active prescriptions</p>
                </CardContent>
              </Card>
            ) : (
              filterPrescriptions('active').map(prescription => (
                <PrescriptionCard key={prescription.id} prescription={prescription} />
              ))
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            {filterPrescriptions('expired').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No expired prescriptions</p>
                </CardContent>
              </Card>
            ) : (
              filterPrescriptions('expired').map(prescription => (
                <PrescriptionCard key={prescription.id} prescription={prescription} />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {prescriptions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No prescriptions yet</p>
                </CardContent>
              </Card>
            ) : (
              prescriptions.map(prescription => (
                <PrescriptionCard key={prescription.id} prescription={prescription} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
