import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Database, FileText, FlaskConical, Activity } from 'lucide-react';
import { AIConfigPanel } from '@/components/ai-governance/AIConfigPanel';
import { AISourceRegistry } from '@/components/ai-governance/AISourceRegistry';
import { AIAuditLogs } from '@/components/ai-governance/AIAuditLogs';
import { AISandbox } from '@/components/ai-governance/AISandbox';
import { AISymptomModules } from '@/components/ai-governance/AISymptomModules';
import { AIAnalytics } from '@/components/ai-governance/AIAnalytics';

/**
 * AI Governance Dashboard - Internal Admin Only
 * 
 * Provides comprehensive control over:
 * - AI configuration profiles (tone, compliance, sources)
 * - Medical source registry and validation
 * - Audit trails and policy changes
 * - Sandbox testing environment
 * - Analytics and research exports
 */
export default function AIGovernance() {
  const [activeTab, setActiveTab] = useState('config');

  // Check admin access
  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['userRoles'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    }
  });

  const isAdmin = userRoles?.some(r => r.role === 'admin');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access Denied: AI Governance Dashboard requires administrator privileges.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">AI Governance & Configuration</h1>
        <p className="text-muted-foreground">
          Internal dashboard for managing AI behavior, sources, compliance, and monitoring
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="config" className="flex gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Configurations</span>
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Sources</span>
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Modules</span>
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="flex gap-2">
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">Sandbox</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration Profiles</CardTitle>
              <CardDescription>
                Manage AI behavior, tone, compliance layers, and data access scope for different contexts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIConfigPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Source Registry</CardTitle>
              <CardDescription>
                Approved medical sources, guidelines, and knowledge bases for AI retrieval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AISourceRegistry />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Symptom Checker Modules</CardTitle>
              <CardDescription>
                Registered AI modules, their storage locations, and validation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AISymptomModules />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sandbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sandbox Environment</CardTitle>
              <CardDescription>
                Test AI configurations with synthetic data before production deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AISandbox />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Immutable record of all AI configuration changes and policy decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIAuditLogs />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Analytics & Exports</CardTitle>
              <CardDescription>
                Anonymized interaction logs, performance metrics, and research exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIAnalytics />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
