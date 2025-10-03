import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SOAPBillingCodesProps {
  soapNoteId: string;
  appointmentId: string;
}

export function SOAPBillingCodes({ soapNoteId }: SOAPBillingCodesProps) {
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const { toast } = useToast();

  const extractCodes = async () => {
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-soap-billing-codes', {
        body: { soap_note_id: soapNoteId }
      });

      if (error) throw error;

      setExtracted(data.extracted_codes);
      toast({
        title: 'Billing codes extracted',
        description: 'AI has extracted CPT and ICD-10 codes from the SOAP note',
      });
    } catch (error: any) {
      toast({
        title: 'Extraction failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Billing Codes
        </CardTitle>
        <CardDescription>Extract CPT and ICD-10 codes from SOAP note</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!extracted ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Click below to extract billing codes using AI from the SOAP note content.
              </AlertDescription>
            </Alert>
            <Button onClick={extractCodes} disabled={extracting} className="w-full">
              {extracting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting codes...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Extract Billing Codes
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">CPT Codes</h4>
              <div className="space-y-2">
                {extracted.cpt_codes?.map((code: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="font-mono">{code.code}</Badge>
                    <span className="flex-1 text-sm">{code.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">ICD-10 Codes</h4>
              <div className="space-y-2">
                {extracted.icd10_codes?.map((code: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge variant="secondary" className="font-mono">{code.code}</Badge>
                    <span className="flex-1 text-sm">{code.description}</span>
                  </div>
                ))}
              </div>
            </div>
            {extracted.notes && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>{extracted.notes}</AlertDescription>
              </Alert>
            )}
            <Button onClick={extractCodes} variant="outline" disabled={extracting} className="w-full">
              {extracting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Re-extract Codes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}