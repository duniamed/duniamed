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

              {/* Allergy Warnings - RED ALERT */}
              {medicalHistory?.summary?.allergies?.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-bold text-destructive">ALLERGY WARNINGS</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {medicalHistory.summary.allergies.map((allergy: any, idx: number) => (
                      <Badge key={idx} variant="destructive" className="text-xs">
                        ⚠️ {typeof allergy === 'string' ? allergy : allergy.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronic Conditions - BLUE INFO */}
              {medicalHistory?.summary?.chronic_conditions?.length > 0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold text-blue-500">Chronic Conditions</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {medicalHistory.summary.chronic_conditions.map((condition: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="border-blue-500 text-blue-500 text-xs">
                        {typeof condition === 'string' ? condition : condition.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Insurance Status - Color Coded */}
              {patient.insurance_status && (
                <div className={`p-3 rounded-lg border ${
                  patient.insurance_status === 'active' ? 'bg-green-500/10 border-green-500/30' :
                  patient.insurance_status === 'expiring' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <Shield className={`h-4 w-4 ${
                      patient.insurance_status === 'active' ? 'text-green-500' :
                      patient.insurance_status === 'expiring' ? 'text-yellow-500' :
                      'text-red-500'
                    }`} />
                    <span className={`text-sm font-semibold ${
                      patient.insurance_status === 'active' ? 'text-green-500' :
                      patient.insurance_status === 'expiring' ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      Insurance: {patient.insurance_status?.toUpperCase()}
                    </span>
                  </div>
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
              {/* Quick Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total Visits</p>
                        <p className="text-2xl font-bold">{medicalHistory?.summary?.total_appointments || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Active Rx</p>
                        <p className="text-2xl font-bold">
                          {medicalHistory?.prescriptions?.filter((rx: any) => rx.status === 'active').length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Last Visit</p>
                        <p className="text-sm font-bold">
                          {medicalHistory?.summary?.last_appointment_date
                            ? new Date(medicalHistory.summary.last_appointment_date).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Age</p>
                        <p className="text-2xl font-bold">
                          {patient.date_of_birth 
                            ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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