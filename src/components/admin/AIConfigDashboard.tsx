import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Database, Activity, Shield, FileText } from "lucide-react";

export const AIConfigDashboard = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load configuration profiles
      const { data: profilesData } = await supabase
        .from('ai_config_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setProfiles(profilesData || []);

      // Load source registry
      const { data: sourcesData } = await supabase
        .from('ai_source_registry')
        .select('*')
        .order('created_at', { ascending: false });
      setSources(sourcesData || []);

      // Load recent logs
      const { data: logsData } = await supabase
        .from('ai_symptom_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      setLogs(logsData || []);
    } catch (error: any) {
      toast({
        title: "Load Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-config-manage-admin', {
        body: {
          action: 'create_profile',
          data: {
            name: `Config ${Date.now()}`,
            context: 'patient',
            responsiveness: {
              tone: 'empathetic',
              verbosity: 'moderate',
              abstain_policy: 'strict'
            },
            compliance_layers: {
              HIPAA: true,
              LGPD: true
            },
            data_access_scope: {
              source_whitelist: [],
              pii_masking: true
            },
            created_by: (await supabase.auth.getUser()).data.user?.id
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Profile Created",
        description: "New AI configuration profile created successfully"
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const exportLogs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-logs-export', {
        body: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString(),
          format: 'json'
        }
      });

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data.logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-logs-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${data.count} logs exported successfully`
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Configuration Dashboard</h1>
          <p className="text-muted-foreground">Manage AI behavior, sources, and compliance</p>
        </div>
        <Shield className="h-12 w-12 text-primary" />
      </div>

      <Tabs defaultValue="profiles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profiles">
            <Settings className="h-4 w-4 mr-2" />
            Profiles
          </TabsTrigger>
          <TabsTrigger value="sources">
            <Database className="h-4 w-4 mr-2" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Activity className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 mr-2" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="sandbox">
            <Shield className="h-4 w-4 mr-2" />
            Sandbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Configuration Profiles</h2>
            <Button onClick={createProfile}>Create New Profile</Button>
          </div>
          <div className="grid gap-4">
            {profiles.map((profile) => (
              <Card key={profile.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">Context: {profile.context}</p>
                    <p className="text-sm text-muted-foreground">Version: {profile.version}</p>
                    <p className="text-sm">
                      Status: <span className={profile.is_active ? "text-green-600" : "text-yellow-600"}>
                        {profile.is_active ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Created: {new Date(profile.created_at).toLocaleDateString()}</p>
                    <p>Updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  <p><strong>Tone:</strong> {profile.responsiveness.tone}</p>
                  <p><strong>Verbosity:</strong> {profile.responsiveness.verbosity}</p>
                  <p><strong>HIPAA:</strong> {profile.compliance_layers.HIPAA ? "✓" : "✗"}</p>
                  <p><strong>LGPD:</strong> {profile.compliance_layers.LGPD ? "✓" : "✗"}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Medical Source Registry</h2>
            <Button>Add New Source</Button>
          </div>
          <div className="grid gap-4">
            {sources.map((source) => (
              <Card key={source.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{source.source_key}</h3>
                    <p className="text-sm text-muted-foreground">Type: {source.source_type}</p>
                    <p className="text-sm text-muted-foreground">Version: {source.version}</p>
                    <p className="text-sm">
                      Status: <span className={
                        source.status === 'approved' ? "text-green-600" :
                        source.status === 'pending' ? "text-yellow-600" : "text-red-600"
                      }>
                        {source.status}
                      </span>
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Valid from: {new Date(source.valid_from).toLocaleDateString()}</p>
                    {source.valid_to && <p>Valid to: {new Date(source.valid_to).toLocaleDateString()}</p>}
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  <p><strong>URI:</strong> <code className="bg-muted px-2 py-1 rounded">{source.uri}</code></p>
                  <p><strong>Retrieval:</strong> {source.retrieval_method}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">AI Interaction Logs</h2>
            <Button onClick={exportLogs}>Export Logs</Button>
          </div>
          <div className="grid gap-4">
            {logs.slice(0, 20).map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">Request: {log.request_id}</p>
                    <p className="text-sm text-muted-foreground">Context: {log.context}</p>
                    <p className="text-sm text-muted-foreground">Role: {log.user_role}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{new Date(log.timestamp).toLocaleString()}</p>
                    <p>Latency: {log.latency_ms}ms</p>
                  </div>
                </div>
                {log.output_summary && (
                  <p className="mt-2 text-sm">{log.output_summary}</p>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <h2 className="text-xl font-semibold">Configuration Audit Trail</h2>
          <p className="text-sm text-muted-foreground">Track all changes to AI configurations</p>
        </TabsContent>

        <TabsContent value="sandbox" className="space-y-4">
          <h2 className="text-xl font-semibold">AI Sandbox Testing</h2>
          <p className="text-sm text-muted-foreground">Test AI configurations before deployment</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};