import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, Shield, Settings } from 'lucide-react';

export const EnterpriseAdminPanel = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [orgData, setOrgData] = useState({
    name: '',
    domain: '',
    ssoProvider: 'saml'
  });

  const setupSSO = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-sso', {
        body: { 
          provider: orgData.ssoProvider,
          organizationId: crypto.randomUUID(),
          domain: orgData.domain
        }
      });
      
      if (error) throw error;
      toast({ title: 'SSO configured successfully' });
    } catch (error: any) {
      toast({ title: 'SSO setup failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const setupMultiClinic = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-clinic-routing', {
        body: { organizationName: orgData.name }
      });
      
      if (error) throw error;
      toast({ title: 'Multi-clinic routing enabled' });
    } catch (error: any) {
      toast({ title: 'Setup failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Enterprise Configuration
          </CardTitle>
          <CardDescription>Configure enterprise-level features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <Input
              value={orgData.name}
              onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
              placeholder="Acme Healthcare"
            />
          </div>
          <div className="space-y-2">
            <Label>Domain</Label>
            <Input
              value={orgData.domain}
              onChange={(e) => setOrgData({ ...orgData, domain: e.target.value })}
              placeholder="acme.com"
            />
          </div>
          <Button onClick={setupMultiClinic} disabled={loading} className="w-full">
            <Users className="mr-2 h-4 w-4" />
            Enable Multi-Clinic Routing
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Single Sign-On (SSO)
          </CardTitle>
          <CardDescription>Configure enterprise SSO authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={setupSSO} disabled={loading} className="w-full">
            <Settings className="mr-2 h-4 w-4" />
            Configure SAML SSO
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
