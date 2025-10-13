import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Download, CheckCircle, AlertTriangle, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ComplianceDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [jurisdiction, setJurisdiction] = useState<'brazil' | 'usa' | 'eu'>('usa');

  const handleGenerateReport = async (reportType: string) => {
    setLoading(true);
    toast({
      title: 'Generating Report',
      description: `Creating ${reportType} report...`,
    });

    // Simulate report generation
    setTimeout(() => {
      setLoading(false);
      toast({
        title: 'Report Ready',
        description: 'Your compliance report has been generated.',
      });
    }, 2000);
  };

  return (
    <DashboardLayout
      title="Compliance Dashboard"
      description="Manage regulatory compliance across jurisdictions"
    >
      <div className="space-y-6">
        {/* Jurisdiction Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance Overview
            </CardTitle>
            <CardDescription>
              Automated compliance monitoring and reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={jurisdiction} onValueChange={(v) => setJurisdiction(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="brazil">🇧🇷 Brazil</TabsTrigger>
                <TabsTrigger value="usa">🇺🇸 USA</TabsTrigger>
                <TabsTrigger value="eu">🇪🇺 EU</TabsTrigger>
              </TabsList>

              {/* Brazil Compliance */}
              <TabsContent value="brazil" className="space-y-4 mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        ANS Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last Submission</span>
                        <Badge variant="outline" className="bg-green-500/10">
                          Feb 1, 2024 - On time
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Next Due</span>
                        <Badge variant="outline">Mar 5, 2024 (5 days)</Badge>
                      </div>
                      <Button 
                        onClick={() => handleGenerateReport('ANS')} 
                        disabled={loading}
                        className="w-full"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Generate ANS Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Nota Fiscal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Issued This Month</span>
                        <Badge>195 invoices</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pending CPF Validation</span>
                        <Badge variant="destructive">13 pending</Badge>
                      </div>
                      <Button 
                        onClick={() => handleGenerateReport('Nota Fiscal')} 
                        disabled={loading}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Generate Batch
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-500/20 bg-purple-500/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-500" />
                        LGPD Compliance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Data Retention</span>
                        <Badge variant="outline" className="bg-green-500/10">
                          7 years active
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Consent Records</span>
                        <Badge>1,247 tracked</Badge>
                      </div>
                      <Button variant="outline" className="w-full">
                        View LGPD Dashboard
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        TISS Claims
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Submitted</span>
                        <Badge className="bg-green-500">142 claims</Badge>
                      </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Auth</span>
                <Badge variant="secondary">8 claims</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rejected</span>
                <Badge variant="destructive">2 claims</Badge>
              </div>
              <Button variant="outline" className="w-full">
                View Claims Details
              </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* USA Compliance */}
              <TabsContent value="usa" className="space-y-4 mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        HIPAA Audit Logs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">PHI Access (30 days)</span>
                        <Badge>2,456 records</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Suspicious Activity</span>
                        <Badge variant="outline" className="bg-green-500/10">
                          0 detected
                        </Badge>
                      </div>
                      <Button 
                        onClick={() => handleGenerateReport('HIPAA Audit')} 
                        disabled={loading}
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Audit Log
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Insurance Eligibility
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Verifications Today</span>
                        <Badge>47 checks</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Success Rate</span>
                        <Badge className="bg-green-500">94%</Badge>
                      </div>
                      <Button variant="outline" className="w-full">
                        View Eligibility Log
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* EU Compliance */}
              <TabsContent value="eu" className="space-y-4 mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-purple-500/20 bg-purple-500/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-500" />
                        GDPR Compliance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Data Export Requests</span>
                        <Badge>3 pending</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Consent Management</span>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                      <Button 
                        onClick={() => handleGenerateReport('GDPR')} 
                        disabled={loading}
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Compliance Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                        EHIC Validation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Validations This Month</span>
                        <Badge>28 cards</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Success Rate</span>
                        <Badge className="bg-green-500">100%</Badge>
                      </div>
                      <Button variant="outline" className="w-full">
                        View Validation Log
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" className="justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Compliance Review
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="mr-2 h-4 w-4" />
                View All Reports
              </Button>
              <Button variant="outline" className="justify-start">
                <Download className="mr-2 h-4 w-4" />
                Export All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}