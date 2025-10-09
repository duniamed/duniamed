import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function CSVImportExport() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<'appointments' | 'patients' | 'specialists'>('appointments');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }

    return rows;
  };

  const importCSV = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setProgress(0);

    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      // Import in batches of 100
      const batchSize = 100;
      const batches = Math.ceil(data.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const batch = data.slice(i * batchSize, (i + 1) * batchSize);
        
        // Map CSV data to database schema based on data type
        let error;
        
        switch (dataType) {
          case 'appointments':
            // Map and validate appointment data - adjust as needed
            ({ error } = await supabase.from('appointments').insert(batch as any));
            break;
          case 'patients':
            // Map and validate patient data - adjust as needed
            ({ error } = await supabase.from('profiles').insert(batch as any));
            break;
          case 'specialists':
            // Map and validate specialist data - adjust as needed
            ({ error } = await supabase.from('specialists').insert(batch as any));
            break;
        }

        if (error) throw error;
        setProgress(((i + 1) / batches) * 100);
      }

      // Log import
      await supabase.from('activities').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'csv_import',
        target_type: dataType,
        metadata: {
          records_imported: data.length,
          file_name: selectedFile.name,
        }
      });

      toast({
        title: "Import successful",
        description: `Imported ${data.length} records`,
      });

      setSelectedFile(null);
      setProgress(0);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import CSV data",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    setProgress(0);

    try {
      let query;
      let filename = '';

      switch (dataType) {
        case 'appointments':
          query = supabase
            .from('appointments')
            .select('*, profiles!patient_id(first_name, last_name), specialists(user_id)')
            .order('scheduled_at', { ascending: false })
            .limit(10000);
          filename = 'appointments_export.csv';
          break;
        case 'patients':
          query = supabase
            .from('profiles')
            .select('*')
            .eq('role', 'patient')
            .limit(10000);
          filename = 'patients_export.csv';
          break;
        case 'specialists':
          query = supabase
            .from('specialists')
            .select('*, profiles!user_id(*)')
            .limit(10000);
          filename = 'specialists_export.csv';
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];

      data.forEach((row: any) => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'object' ? JSON.stringify(value) : value;
        });
        csvRows.push(values.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      // Log export
      await supabase.from('activities').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'csv_export',
        target_type: dataType,
        metadata: {
          records_exported: data.length,
          file_name: filename,
        }
      });

      setProgress(100);
      toast({
        title: "Export successful",
        description: `Exported ${data.length} records`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <DashboardLayout
      title="CSV Import/Export"
      description="Import and export data in CSV format"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import CSV
            </CardTitle>
            <CardDescription>
              Upload a CSV file to import data into the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure your CSV file matches the required format. First row should contain column headers.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="import-type">Data Type</Label>
              <Select value={dataType} onValueChange={(value: any) => setDataType(value)}>
                <SelectTrigger id="import-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointments">Appointments</SelectItem>
                  <SelectItem value="patients">Patients</SelectItem>
                  <SelectItem value="specialists">Specialists</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Select CSV File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={importing}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {importing && (
              <div className="space-y-2">
                <Label>Import Progress</Label>
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">
                  {progress.toFixed(0)}%
                </p>
              </div>
            )}

            <Button
              onClick={importCSV}
              disabled={!selectedFile || importing}
              className="w-full"
            >
              {importing ? "Importing..." : "Import CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export CSV
            </CardTitle>
            <CardDescription>
              Download your data as a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Export will include up to 10,000 most recent records. For larger exports, contact support.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="export-type">Data Type</Label>
              <Select value={dataType} onValueChange={(value: any) => setDataType(value)}>
                <SelectTrigger id="export-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointments">Appointments</SelectItem>
                  <SelectItem value="patients">Patients</SelectItem>
                  <SelectItem value="specialists">Specialists</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exporting && (
              <div className="space-y-2">
                <Label>Export Progress</Label>
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">
                  {progress === 100 ? 'Complete!' : 'Processing...'}
                </p>
              </div>
            )}

            <Button
              onClick={exportCSV}
              disabled={exporting}
              className="w-full"
              variant="outline"
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
