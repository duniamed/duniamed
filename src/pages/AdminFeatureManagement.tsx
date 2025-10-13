// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings, Users, Shield, Zap } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  is_enabled: boolean;
  access_level: 'free' | 'basic' | 'premium' | 'enterprise' | 'custom';
  allowed_roles: string[];
  config: Record<string, any>;
}

const AdminFeatureManagement = () => {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_feature_flags')
        .select('*')
        .order('feature_name');

      if (error) throw error;
      setFeatures(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading features",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureId: string, currentState: boolean) => {
    setSaving(featureId);
    try {
      const { error } = await supabase
        .from('admin_feature_flags')
        .update({ is_enabled: !currentState, updated_at: new Date().toISOString() })
        .eq('id', featureId);

      if (error) throw error;

      setFeatures(prev => prev.map(f => 
        f.id === featureId ? { ...f, is_enabled: !currentState } : f
      ));

      toast({
        title: "Feature updated",
        description: `Feature ${!currentState ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error updating feature",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const updateAccessLevel = async (featureId: string, newLevel: string) => {
    setSaving(featureId);
    try {
      const { error } = await supabase
        .from('admin_feature_flags')
        .update({ access_level: newLevel, updated_at: new Date().toISOString() })
        .eq('id', featureId);

      if (error) throw error;

      setFeatures(prev => prev.map(f => 
        f.id === featureId ? { ...f, access_level: newLevel as any } : f
      ));

      toast({
        title: "Access level updated",
        description: `Feature access updated to ${newLevel}`
      });
    } catch (error: any) {
      toast({
        title: "Error updating access level",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const updateAllowedRoles = async (featureId: string, roles: string[]) => {
    setSaving(featureId);
    try {
      const { error } = await supabase
        .from('admin_feature_flags')
        .update({ allowed_roles: roles, updated_at: new Date().toISOString() })
        .eq('id', featureId);

      if (error) throw error;

      setFeatures(prev => prev.map(f => 
        f.id === featureId ? { ...f, allowed_roles: roles } : f
      ));

      toast({
        title: "Roles updated",
        description: "Allowed roles updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error updating roles",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'free': return 'bg-green-500';
      case 'basic': return 'bg-blue-500';
      case 'premium': return 'bg-purple-500';
      case 'enterprise': return 'bg-orange-500';
      case 'custom': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Feature Management">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Feature Management">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Feature Control Panel
            </CardTitle>
            <CardDescription>
              Manage all platform features, access levels, and user permissions.
              Changes apply instantly across all users. Unlimited edge functions available.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Features</TabsTrigger>
            <TabsTrigger value="voice-ai">Voice AI</TabsTrigger>
            <TabsTrigger value="clinical">Clinical Tools</TabsTrigger>
            <TabsTrigger value="payments">Payments & Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {features.map((feature) => (
              <Card key={feature.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{feature.feature_name}</CardTitle>
                        <Badge className={getAccessLevelColor(feature.access_level)}>
                          {feature.access_level}
                        </Badge>
                        {saving === feature.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                    <Switch
                      checked={feature.is_enabled}
                      onCheckedChange={() => toggleFeature(feature.id, feature.is_enabled)}
                      disabled={saving === feature.id}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Access Level</Label>
                      <Select
                        value={feature.access_level}
                        onValueChange={(value) => updateAccessLevel(feature.id, value)}
                        disabled={saving === feature.id}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Allowed Roles</Label>
                      <div className="flex flex-wrap gap-2">
                        {['patient', 'specialist', 'clinic_admin', 'admin'].map((role) => (
                          <Badge
                            key={role}
                            variant={feature.allowed_roles.includes(role) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const newRoles = feature.allowed_roles.includes(role)
                                ? feature.allowed_roles.filter(r => r !== role)
                                : [...feature.allowed_roles, role];
                              updateAllowedRoles(feature.id, newRoles);
                            }}
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Feature Key: <code className="bg-muted px-1 rounded">{feature.feature_key}</code>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="voice-ai" className="space-y-4">
            {features.filter(f => f.feature_key.includes('voice') || f.feature_key.includes('ai')).map((feature) => (
              <Card key={feature.id}>
                {/* Same card content as above */}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <CardTitle className="text-lg">{feature.feature_name}</CardTitle>
                        <Badge className={getAccessLevelColor(feature.access_level)}>
                          {feature.access_level}
                        </Badge>
                      </div>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                    <Switch
                      checked={feature.is_enabled}
                      onCheckedChange={() => toggleFeature(feature.id, feature.is_enabled)}
                    />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminFeatureManagement;
