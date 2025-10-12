import { useState, useEffect } from 'react';
import { User, Calendar, Pill, FileText, AlertCircle, Shield, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface PatientDetailPanelProps {
  patientId: string;
}

export function PatientDetailPanel({ patientId }: PatientDetailPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [medicalHistory, setMedicalHistory] = useState<any>(null);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    setIsLoading(true);
    try {
      // Get patient profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();

      // Get medical summary
      const { data: summary } = await supabase
        .from('patient_medical_summary')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      // Get appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, specialists(*)')
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: false })
        .limit(10);

      // Get prescriptions
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get medical records
      const { data: records } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false })
        .limit(10);

      setPatient(profile);
      setMedicalHistory({
        summary,
        appointments,
        prescriptions,
        records
      });
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={patient.avatar_url} />
              <AvatarFallback className="text-2xl">
                {patient.first_name?.[0]}{patient.last_name?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-2xl font-bold">
                  {patient.first_name} {patient.last_name}
                </h2>
                {patient.date_of_birth && (
                  <p className="text-muted-foreground">
                    Age: {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years
                  </p>
                )}
              </div>

              <div className="flex gap-4 text-sm">
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.phone}</span>
                  </div>
                )}
              </div>

              {medicalHistory?.summary?.allergies?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm font-medium">Allergies:</span>
                  {medicalHistory.summary.allergies.map((allergy: any, idx: number) => (
                    <Badge key={idx} variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {typeof allergy === 'string' ? allergy : allergy.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Details Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                  <p className="text-2xl font-bold">
                    {medicalHistory?.summary?.total_appointments || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Active Prescriptions</p>
                  <p className="text-2xl font-bold">
                    {medicalHistory?.summary?.has_active_prescriptions ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Visit</p>
                  <p className="text-2xl font-bold">
                    {medicalHistory?.summary?.last_appointment_date
                      ? new Date(medicalHistory.summary.last_appointment_date).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <Separator />

              {medicalHistory?.summary?.chronic_conditions?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Chronic Conditions:</p>
                  <div className="flex gap-2 flex-wrap">
                    {medicalHistory.summary.chronic_conditions.map((condition: any, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {typeof condition === 'string' ? condition : condition.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {medicalHistory?.summary?.current_medications?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Current Medications:</p>
                  <div className="space-y-2">
                    {medicalHistory.summary.current_medications.map((med: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Pill className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {typeof med === 'string' ? med : `${med.name} - ${med.dosage}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-3">
          {medicalHistory?.appointments?.map((apt: any) => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(apt.scheduled_at).toLocaleString()}
                      </span>
                      <Badge variant={
                        apt.status === 'completed' ? 'default' :
                        apt.status === 'cancelled' ? 'destructive' : 'secondary'
                      }>
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {apt.chief_complaint || 'General consultation'}
                    </p>
                    {apt.specialists && (
                      <p className="text-xs text-muted-foreground">
                        with {apt.specialists.specialty?.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="medications" className="space-y-3">
          {medicalHistory?.prescriptions?.map((rx: any) => (
            <Card key={rx.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{rx.medication_name}</span>
                      <Badge variant={rx.status === 'active' ? 'default' : 'secondary'}>
                        {rx.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rx.dosage}</p>
                    <p className="text-xs text-muted-foreground">
                      Prescribed: {new Date(rx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="records" className="space-y-3">
          {medicalHistory?.records?.map((record: any) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{record.document_name || record.file_type}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded: {new Date(record.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}