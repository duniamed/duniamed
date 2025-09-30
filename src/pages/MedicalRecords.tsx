import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface MedicalRecord {
  id: string;
  title: string;
  description: string;
  record_type: string;
  file_url: string;
  file_type: string;
  recorded_at: string;
  specialist_id: string;
  appointment_id: string;
}

export default function MedicalRecords() {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <MedicalRecordsContent />
    </ProtectedRoute>
  );
}

function MedicalRecordsContent() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const fetchRecords = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', user.id)
      .order('recorded_at', { ascending: false });

    if (!error && data) {
      setRecords(data);
    }

    setLoading(false);
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'lab_result':
        return 'bg-blue-500';
      case 'prescription':
        return 'bg-green-500';
      case 'imaging':
        return 'bg-purple-500';
      case 'clinical_note':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Medical Records</h1>
              <p className="text-muted-foreground">Access your health documents</p>
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export All (FHIR)
            </Button>
          </div>

          {records.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No medical records yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {records.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{record.title}</CardTitle>
                        <CardDescription>
                          {format(new Date(record.recorded_at), 'MMM dd, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge className={getRecordTypeColor(record.record_type)}>
                        {record.record_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{record.description}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
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
