import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  Shield, 
  FileText, 
  Download, 
  Share2, 
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface EHDSConsent {
  id: string;
  consent_type: string;
  granted: boolean;
  granted_at: string;
  jurisdiction: string;
}

interface DataPortabilityRequest {
  id: string;
  request_type: string;
  status: string;
  created_at: string;
  export_url: string | null;
}

const consentTypes = [
  {
    type: 'data_portability',
    title: 'Data Portability',
    description: 'Allow export and transfer of your health data to other EU healthcare systems',
  },
  {
    type: 'cross_border_access',
    title: 'Cross-Border Access',
    description: 'Enable healthcare providers across EU borders to access your medical records',
  },
  {
    type: 'research_use',
    title: 'Research Use',
    description: 'Anonymized use of your health data for medical research within EHDS framework',
  },
  {
    type: 'secondary_use',
    title: 'Secondary Use',
    description: 'Allow secondary use of your health data for public health monitoring',
  },
];

export default function EHDSCompliance() {
  const [consents, setConsents] = useState<EHDSConsent[]>([]);
  const [requests, setRequests] = useState<DataPortabilityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [consentsRes, requestsRes] = await Promise.all([
        supabase.from('ehds_consents').select('*').eq('user_id', user.id),
        supabase.from('data_portability_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (consentsRes.error) throw consentsRes.error;
      if (requestsRes.error) throw requestsRes.error;

      setConsents(consentsRes.data || []);
      setRequests(requestsRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsentToggle = async (consentType: string, granted: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingConsent = consents.find(c => c.consent_type === consentType);

      if (existingConsent) {
        const { error } = await supabase
          .from('ehds_consents')
          .update({ 
            granted, 
            revoked_at: granted ? null : new Date().toISOString() 
          })
          .eq('id', existingConsent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ehds_consents')
          .insert({
            user_id: user.id,
            consent_type: consentType,
            granted,
            jurisdiction: 'EU',
            ehds_compliant: true,
          });

        if (error) throw error;
      }

      toast({
        title: 'Consent updated',
        description: `Your ${consentType.replace('_', ' ')} consent has been ${granted ? 'granted' : 'revoked'}`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Error updating consent',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const requestDataExport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('data_portability_requests')
        .insert({
          user_id: user.id,
          request_type: 'export',
          status: 'pending',
          data_format: 'fhir_json',
        });

      if (error) throw error;

      toast({
        title: 'Export requested',
        description: 'Your data export request has been submitted. You will be notified when it\'s ready.',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Error requesting export',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getConsentStatus = (type: string) => {
    const consent = consents.find(c => c.consent_type === type);
    return consent?.granted || false;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading EHDS compliance data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">EHDS Compliance & Data Portability</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your European Health Data Space consents and data portability requests
          </p>
        </div>

        {/* EHDS Consents */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>EHDS Consents</CardTitle>
            <CardDescription>
              Control how your health data can be used within the European Health Data Space
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consentTypes.map((consent) => {
                const isGranted = getConsentStatus(consent.type);
                return (
                  <div key={consent.type} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Checkbox
                      checked={isGranted}
                      onCheckedChange={(checked) => 
                        handleConsentToggle(consent.type, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{consent.title}</h3>
                        {isGranted && (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{consent.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Data Portability */}
        <Card>
          <CardHeader>
            <CardTitle>Data Portability Requests</CardTitle>
            <CardDescription>
              Export or transfer your health data to other healthcare systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Button onClick={requestDataExport}>
                <Download className="h-4 w-4 mr-2" />
                Request Data Export
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Transfer to Another System
              </Button>
            </div>

            {requests.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold mb-3">Recent Requests</h4>
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <p className="font-medium capitalize">{request.request_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        request.status === 'completed' ? 'default' :
                        request.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {request.status}
                      </Badge>
                      {request.export_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={request.export_url} download>
                            <FileText className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data portability requests yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
