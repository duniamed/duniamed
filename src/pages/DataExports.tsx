import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText, Package, Shield, Clock, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ExportJob {
  id: string;
  export_type: string;
  format: string;
  status: string;
  secure_download_link: string | null;
  link_expires_at: string | null;
  download_count: number;
  max_downloads: number;
  file_size_bytes: number | null;
  created_at: string;
  completed_at: string | null;
}

export default function DataExports() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  
  const [exportConfig, setExportConfig] = useState({
    format: 'fhir_json',
    includeMedicalRecords: true,
    includePrescriptions: true,
    includeAppointments: true,
    includeLabResults: true,
  });

  useEffect(() => {
    loadExportJobs();
  }, []);

  const loadExportJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('data_export_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExportJobs(data || []);
    } catch (error) {
      console.error('Error loading export jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load export history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestExport = async () => {
    setRequesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dataScope = {
        medical_records: exportConfig.includeMedicalRecords,
        prescriptions: exportConfig.includePrescriptions,
        appointments: exportConfig.includeAppointments,
        lab_results: exportConfig.includeLabResults,
      };

      const { error } = await supabase
        .from('data_export_jobs')
        .insert({
          user_id: user.id,
          export_type: 'patient_records',
          requested_by_role: 'patient',
          format: exportConfig.format,
          data_scope: dataScope,
          status: 'queued',
        });

      if (error) throw error;

      toast({
        title: "Export Requested",
        description: "Your data export is being prepared. You'll receive a notification when it's ready.",
      });

      loadExportJobs();
    } catch (error) {
      console.error('Error requesting export:', error);
      toast({
        title: "Error",
        description: "Failed to request export. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRequesting(false);
    }
  };

  const downloadExport = async (jobId: string, downloadLink: string) => {
    try {
      // Update download count
      const job = exportJobs.find(j => j.id === jobId);
      if (!job) return;
      
      const { error } = await supabase
        .from('data_export_jobs')
        .update({ download_count: job.download_count + 1 })
        .eq('id', jobId);

      if (error) throw error;

      window.open(downloadLink, '_blank');
      
      toast({
        title: "Download Started",
        description: "Your data export download has begun.",
      });

      loadExportJobs();
    } catch (error) {
      console.error('Error downloading export:', error);
      toast({
        title: "Error",
        description: "Failed to download export.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      queued: 'bg-yellow-500',
      processing: 'bg-blue-500',
      completed: 'bg-green-500',
      failed: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Data Exports & Portability
            <InfoTooltip content="Export your complete medical records in standard formats. All exports are encrypted, time-limited, and comply with data portability regulations." />
          </h1>
          <p className="text-muted-foreground mt-2">
            Export and download your health data in portable formats
          </p>
        </div>

        <div className="grid gap-6">
          {/* Request New Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Request New Export
                <InfoTooltip content="Choose what data to export and in what format. FHIR JSON is recommended for importing into other healthcare systems." />
              </CardTitle>
              <CardDescription>
                Configure and request a new data export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Format Selection */}
              <div>
                <Label>Export Format</Label>
                <Select 
                  value={exportConfig.format}
                  onValueChange={(value) => setExportConfig({ ...exportConfig, format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fhir_json">FHIR JSON (Recommended)</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                    <SelectItem value="hl7">HL7 Format</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Selection */}
              <div className="space-y-3">
                <Label>Include in Export:</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="medical-records"
                    checked={exportConfig.includeMedicalRecords}
                    onCheckedChange={(checked) => 
                      setExportConfig({ ...exportConfig, includeMedicalRecords: checked as boolean })
                    }
                  />
                  <label htmlFor="medical-records" className="text-sm cursor-pointer">
                    Medical Records
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prescriptions"
                    checked={exportConfig.includePrescriptions}
                    onCheckedChange={(checked) => 
                      setExportConfig({ ...exportConfig, includePrescriptions: checked as boolean })
                    }
                  />
                  <label htmlFor="prescriptions" className="text-sm cursor-pointer">
                    Prescriptions
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="appointments"
                    checked={exportConfig.includeAppointments}
                    onCheckedChange={(checked) => 
                      setExportConfig({ ...exportConfig, includeAppointments: checked as boolean })
                    }
                  />
                  <label htmlFor="appointments" className="text-sm cursor-pointer">
                    Appointment History
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lab-results"
                    checked={exportConfig.includeLabResults}
                    onCheckedChange={(checked) => 
                      setExportConfig({ ...exportConfig, includeLabResults: checked as boolean })
                    }
                  />
                  <label htmlFor="lab-results" className="text-sm cursor-pointer">
                    Lab Results
                  </label>
                </div>
              </div>

              <Button 
                onClick={requestExport} 
                disabled={requesting}
                className="w-full"
              >
                {requesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Package className="mr-2 h-4 w-4" />
                Request Export
              </Button>
            </CardContent>
          </Card>

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export History
                <InfoTooltip content="View and download your previous exports. Links expire after 7 days and have download limits for security." />
              </CardTitle>
              <CardDescription>
                View and download your previous data exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exportJobs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No export history
                </p>
              ) : (
                <div className="space-y-4">
                  {exportJobs.map((job) => {
                    const expired = job.link_expires_at && new Date(job.link_expires_at) < new Date();
                    const canDownload = job.status === 'completed' && 
                                       job.secure_download_link && 
                                       !expired && 
                                       job.download_count < job.max_downloads;

                    return (
                      <div key={job.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                            <p className="text-sm font-medium mt-2">
                              {job.export_type.replace('_', ' ')} - {job.format.toUpperCase()}
                            </p>
                          </div>
                          {job.file_size_bytes && (
                            <Badge variant="outline">
                              {formatFileSize(job.file_size_bytes)}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created: {new Date(job.created_at).toLocaleDateString()}
                          </span>
                          {job.completed_at && (
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Completed: {new Date(job.completed_at).toLocaleDateString()}
                            </span>
                          )}
                          {job.link_expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires: {new Date(job.link_expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {job.status === 'completed' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => job.secure_download_link && downloadExport(job.id, job.secure_download_link)}
                              disabled={!canDownload}
                              size="sm"
                              className="flex-1"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {expired ? 'Expired' : 
                               job.download_count >= job.max_downloads ? 'Limit Reached' :
                               `Download (${job.download_count}/${job.max_downloads})`}
                            </Button>
                            {canDownload && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => job.secure_download_link && window.open(job.secure_download_link, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Data Security & Privacy</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• All exports are encrypted and signed for authenticity</li>
                    <li>• Download links expire after 7 days for security</li>
                    <li>• Limited downloads prevent unauthorized sharing</li>
                    <li>• Complete audit trail maintained for compliance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
