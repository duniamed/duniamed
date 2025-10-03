import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Upload, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAutoLogAccess } from '@/hooks/useDataAccessLogger';
import { ConsentGate } from '@/components/ConsentGate';

interface MedicalRecord {
  id: string;
  title: string;
  description: string;
  record_type: string;
  file_url: string;
  file_type: string;
  file_size: number;
  recorded_at: string;
  created_at: string;
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  // C15 PRIVACY - Auto-log access
  useAutoLogAccess({
    resourceType: 'medical_records',
    accessType: 'read',
    purpose: 'Patient viewing own medical records'
  });

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const fetchRecords = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRecords(data);
    }

    setLoading(false);
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('medical-records')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getRecordTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      lab_result: 'bg-blue-500/10 text-blue-500',
      prescription: 'bg-purple-500/10 text-purple-500',
      imaging: 'bg-green-500/10 text-green-500',
      diagnosis: 'bg-red-500/10 text-red-500',
      vaccination: 'bg-yellow-500/10 text-yellow-500',
      other: 'bg-gray-500/10 text-gray-500',
    };
    return colors[type] || colors.other;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
      title="Medical Records"
      description="View and manage your health documents"
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => navigate('/patient/medical-records/upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Record
          </Button>
        </div>

        <div className="space-y-4">
          {records.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No medical records yet</p>
                <Button onClick={() => navigate('/patient/medical-records/upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Record
                </Button>
              </CardContent>
            </Card>
          ) : (
            records.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{record.title}</CardTitle>
                        <CardDescription>{record.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getRecordTypeBadge(record.record_type)}>
                      {record.record_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(record.created_at).toLocaleDateString()}
                      </div>
                      <span>•</span>
                      <span>{formatFileSize(record.file_size)}</span>
                      <span>•</span>
                      <span>{record.file_type}</span>
                    </div>
                    <ConsentGate
                      operation="download_medical_record"
                      purpose="Download and view protected health information"
                      dataTypes={['medical_records']}
                      onConsent={() => downloadFile(record.file_url, record.title)}
                      onDeny={() => {}}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </ConsentGate>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
