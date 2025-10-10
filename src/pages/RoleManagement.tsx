import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * C22 RBAC - Role-Based Access Control
 * Patients see who accessed their data and receive alerts
 * Specialists apply role templates, monitor access logs
 * Clinics build custom roles, maintain audit trails
 */

function RoleManagementContent() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [accessAlerts, setAccessAlerts] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load user roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    setRoles(rolesData || []);

    // Load sensitive access alerts
    const { data: alertsData } = await supabase
      .from('sensitive_access_alerts')
      .select(`
        *,
        accessed_by:auth.users!sensitive_access_alerts_accessed_by_fkey(email)
      `)
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    setAccessAlerts(alertsData || []);

    // Load audit logs (using existing table)
    const { data: logsData } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setAccessLogs(logsData || []);
    setLoading(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'clinic_admin': return 'bg-purple-100 text-purple-800';
      case 'specialist': return 'bg-blue-100 text-blue-800';
      case 'support_agent': return 'bg-green-100 text-green-800';
      case 'patient': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Access Control & Security" description="Monitor who accesses your data">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold">Your Account Roles</h2>
            <InfoTooltip>Roles determine what actions you can perform in the system. Contact an administrator to request additional roles.</InfoTooltip>
          </div>

          {roles.length === 0 ? (
            <p className="text-muted-foreground">No roles assigned yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roles.map((role: any) => (
                <Badge key={role.id} className={getRoleBadgeColor(role.role)}>
                  {role.role}
                  {role.expires_at && (
                    <span className="ml-2 text-xs">
                      (expires: {new Date(role.expires_at).toLocaleDateString()})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold">Sensitive Data Access Alerts</h2>
            <InfoTooltip>Get notified when healthcare providers access your sensitive medical information. This helps you stay informed about who is viewing your data.</InfoTooltip>
          </div>

          {accessAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No access alerts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accessAlerts.map((alert: any) => (
                <Alert key={alert.id}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {alert.accessed_by?.email || 'Unknown user'} accessed your {alert.resource_type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.created_at).toLocaleString()} • {alert.access_type}
                        </p>
                      </div>
                      <Badge variant={alert.alert_sent ? 'default' : 'secondary'}>
                        {alert.alert_sent ? 'Notified' : 'Pending'}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold">Complete Access Log</h2>
            <InfoTooltip>A complete audit trail of everyone who has accessed your data, when they accessed it, and what action they performed. This log is immutable and maintained for compliance.</InfoTooltip>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading access logs...</div>
          ) : accessLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No access logs yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {accessLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">
                      {log.action} • {log.resource_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Audit Log
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

export default function RoleManagement() {
  return (
    <ProtectedRoute>
      <RoleManagementContent />
    </ProtectedRoute>
  );
}
