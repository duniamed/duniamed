import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function PDFExporter() {
  const [exportType, setExportType] = useState<string>('medical_records');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const exportToPDF = async () => {
    setLoading(true);
    try {
      let data: any = {};

      // Fetch data based on export type
      if (exportType === 'medical_records') {
        const { data: records } = await supabase
          .from('medical_records')
          .select('*')
          .order('created_at', { ascending: false });
        data.records = records;
      } else if (exportType === 'appointments') {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('*')
          .order('scheduled_at', { ascending: false });
        data.appointments = appointments;
      }

      const { data: result, error } = await supabase.functions.invoke('generate-pdf', {
        body: {
          exportType,
          data
        }
      });

      if (error) throw error;

      toast({
        title: "Export Successful",
        description: "Your PDF has been generated and is ready to download",
      });

      // Open the signed URL
      if (result?.file_url) {
        window.open(result.file_url, '_blank');
      }
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Export to PDF</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Export Type</label>
          <Select value={exportType} onValueChange={setExportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select export type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="medical_records">Medical Records</SelectItem>
              <SelectItem value="appointments">Appointments History</SelectItem>
              <SelectItem value="prescriptions">Prescriptions</SelectItem>
              <SelectItem value="profile">Profile Information</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportToPDF} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export to PDF
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          The PDF will be available for download for 7 days
        </p>
      </div>
    </Card>
  );
}