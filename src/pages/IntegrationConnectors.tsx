import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plug, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

/**
 * C21 CONNECTORS - Integration Management
 * Patients consent to data sharing across systems
 * Specialists request integrations, activate connectors
 * Clinics track integration status, deploy plug-ins
 */

const AVAILABLE_CONNECTORS = [
  {
    type: 'ehr_fhir',
    name: 'FHIR EHR Integration',
    description: 'Connect to your Electronic Health Record system using FHIR standards',
    requiresRegistration: true,
    registrationUrl: 'https://fhir.org/',
    scopes: ['appointments', 'medical_records', 'prescriptions']
  },
  {
    type: 'billing_api',
    name: 'Billing System',
    description: 'Sync invoices and payments with your billing software',
    requiresRegistration: false,
    scopes: ['invoices', 'payments']
  },
  {
    type: 'crm_sync',
    name: 'CRM Integration',
    description: 'Sync patient data with your Customer Relationship Management system',
    requiresRegistration: true,
    registrationUrl: 'https://www.salesforce.com/',
    scopes: ['contacts', 'appointments', 'communications']
  }
];

function IntegrationConnectorsContent() {
  const { user } = useAuth();
  const [connectors, setConnectors] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectors();
    loadSyncLogs();
  }, [user]);

  const loadConnectors = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connector_configurations')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading connectors:', error);
    } else {
      setConnectors(data || []);
    }
    setLoading(false);
  };

  const loadSyncLogs = async () => {
    if (!user) return;

    const { data: configs } = await supabase
      .from('connector_configurations')
      .select('id')
      .eq('user_id', user.id);

    if (configs && configs.length > 0) {
      const { data, error } = await supabase
        .from('connector_sync_logs')
        .select('*')
        .in('connector_id', configs.map(c => c.id))
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error) {
        setSyncLogs(data || []);
      }
    }
  };

  const activateConnector = async (connectorType: string) => {
    if (!user) return;

    const connector = AVAILABLE_CONNECTORS.find(c => c.type === connectorType);
    if (!connector) return;

    if (connector.requiresRegistration) {
      toast.info(
        `Registration Required: Please register at ${connector.registrationUrl} first`,
        { duration: 5000 }
      );
      return;
    }

    const { error } = await supabase
      .from('connector_configurations')
      .insert({
        user_id: user.id,
        connector_type: connectorType,
        connector_name: connector.name,
        scopes: connector.scopes,
        is_active: true
      });

    if (error) {
      console.error('Error activating connector:', error);
      toast.error('Failed to activate connector');
    } else {
      toast.success('Connector activated successfully!');
      loadConnectors();
    }
  };

  const toggleConnector = async (connectorId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('connector_configurations')
      .update({ is_active: !isActive })
      .eq('id', connectorId);

    if (error) {
      console.error('Error toggling connector:', error);
      toast.error('Failed to update connector');
    } else {
      toast.success(`Connector ${!isActive ? 'enabled' : 'disabled'}`);
      loadConnectors();
    }
  };

  const isConnectorActive = (type: string) => {
    return connectors.some((c: any) => c.connector_type === type && c.is_active);
  };

  const getConnectorStatus = (type: string) => {
    return connectors.find((c: any) => c.connector_type === type);
  };

  return (
    <DashboardLayout title="Integration Connectors" description="Connect to external systems">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold">Available Connectors</h2>
            <InfoTooltip content="Connect your account to external systems for seamless data sharing. You control what data is shared and can revoke access anytime." />
          </div>

          <div className="grid gap-4">
            {AVAILABLE_CONNECTORS.map((connector) => {
              const status = getConnectorStatus(connector.type);
              const isActive = isConnectorActive(connector.type);

              return (
                <Card key={connector.type} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Plug className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">{connector.name}</h3>
                        {status && (
                          <Badge variant={isActive ? 'default' : 'secondary'}>
                            {isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        )}
                        {connector.requiresRegistration && (
                          <Badge variant="outline">Registration Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{connector.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-muted-foreground">Scopes:</span>
                        {connector.scopes.map(scope => (
                          <Badge key={scope} variant="outline" className="text-xs">{scope}</Badge>
                        ))}
                      </div>
                      {status && status.last_sync_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last synced: {new Date(status.last_sync_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {status ? (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => toggleConnector(status.id, isActive)}
                          />
                          <Label className="text-xs">{isActive ? 'Enabled' : 'Disabled'}</Label>
                        </div>
                      ) : (
                        <Button onClick={() => activateConnector(connector.type)}>
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold">Recent Sync Activity</h2>
            <InfoTooltip content="Monitor your data synchronization activity. All syncs are logged for your records." />
          </div>

          {syncLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sync activity yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {syncLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : log.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{log.sync_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.records_synced} records • {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function IntegrationConnectors() {
  return (
    <ProtectedRoute>
      <IntegrationConnectorsContent />
    </ProtectedRoute>
  );
}
