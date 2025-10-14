import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Shield } from "lucide-react";

export default function EnterpriseSSOLogin() {
  const [organizationId, setOrganizationId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const initiateSSO = async (provider: string) => {
    if (!organizationId) {
      toast({ title: "Missing organization ID", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-sso', {
        body: { provider, organizationId, samlResponse: 'simulated-saml' }
      });

      if (error) throw error;

      toast({
        title: "SSO Login Successful",
        description: `Authenticated as ${data.user.email}`
      });
    } catch (error: any) {
      toast({ title: "SSO Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Enterprise SSO Login
        </CardTitle>
        <CardDescription>Sign in with your organization credentials</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orgId">Organization ID</Label>
          <Input
            id="orgId"
            placeholder="Enter your organization ID"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Button 
            onClick={() => initiateSSO('saml')} 
            disabled={loading} 
            className="w-full"
            variant="outline"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Sign in with SAML
          </Button>

          <Button 
            onClick={() => initiateSSO('okta')} 
            disabled={loading} 
            className="w-full"
            variant="outline"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Sign in with Okta
          </Button>

          <Button 
            onClick={() => initiateSSO('azure-ad')} 
            disabled={loading} 
            className="w-full"
            variant="outline"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Sign in with Azure AD
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
