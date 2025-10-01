import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Instagram, Globe, Facebook, Twitter, Link2, CheckCircle2, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

interface Integration {
  id: string;
  integration_type: string;
  is_active: boolean;
  profile_id: string | null;
  profile_data: any;
  created_at: string;
}

const integrationConfig = {
  google_business: {
    name: 'Google Business',
    icon: Globe,
    color: 'text-blue-600',
    description: 'Sync your clinic profile with Google Business and appear on Google Maps',
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    description: 'Share updates and connect with patients on Instagram',
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-500',
    description: 'Manage your clinic Facebook page',
  },
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: 'text-sky-500',
    description: 'Post updates and engage with your community on Twitter',
  },
};

export default function ClinicIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get clinic ID
      const { data: clinics } = await supabase
        .from('clinics')
        .select('id')
        .eq('created_by', user.id)
        .single();

      if (!clinics) {
        toast({
          title: 'No clinic found',
          description: 'Please create a clinic first',
          variant: 'destructive',
        });
        return;
      }

      setClinicId(clinics.id);

      // Load integrations
      const { data, error } = await supabase
        .from('clinic_integrations')
        .select('*')
        .eq('clinic_id', clinics.id);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading integrations',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integrationType: string) => {
    if (!clinicId) return;

    try {
      // Call edge function to initiate OAuth flow
      const { data, error } = await supabase.functions.invoke('oauth-connect', {
        body: { 
          integration_type: integrationType,
          clinic_id: clinicId,
        },
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Redirect to OAuth authorization URL
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast({
        title: 'Connection failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('clinic_integrations')
        .update({ is_active: false })
        .eq('id', integrationId);

      if (error) throw error;

      toast({
        title: 'Integration disconnected',
        description: 'The integration has been disconnected successfully',
      });

      loadIntegrations();
    } catch (error: any) {
      toast({
        title: 'Error disconnecting',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getIntegration = (type: string) => {
    return integrations.find(i => i.integration_type === type);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading integrations...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Clinic Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect your clinic with external platforms to expand your reach
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(integrationConfig).map(([type, config]) => {
            const integration = getIntegration(type);
            const Icon = config.icon;
            const isConnected = integration?.is_active;

            return (
              <Card key={type}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-8 w-8 ${config.color}`} />
                      <div>
                        <CardTitle>{config.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {config.description}
                        </CardDescription>
                      </div>
                    </div>
                    {isConnected ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isConnected ? (
                    <div className="space-y-4">
                      {integration.profile_id && (
                        <div className="text-sm text-muted-foreground">
                          Profile ID: {integration.profile_id}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleDisconnect(integration.id)}
                        >
                          Disconnect
                        </Button>
                        <Button variant="secondary">
                          <Link2 className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => handleConnect(type)} className="w-full">
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect {config.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
