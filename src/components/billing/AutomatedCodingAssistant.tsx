import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { FileText, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AutomatedCodingAssistant = ({ appointmentId }: { appointmentId: string }) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [codes, setCodes] = useState<any>(null);

  const generateCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('automated-medical-coding', {
        body: {
          appointmentId,
          clinicalNotes: notes,
          diagnosis: '',
          procedures: []
        }
      });

      if (error) throw error;
      setCodes(data.codes);
      toast.success('Medical codes generated');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Automated Medical Coding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter clinical notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />

        <Button onClick={generateCodes} disabled={loading || !notes}>
          {loading ? 'Generating...' : 'Generate Codes'}
        </Button>

        {codes && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                ICD-10 Codes
              </h4>
              <ul className="space-y-1">
                {codes.icd10Codes.map((code: any, idx: number) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span className="font-mono">{code.code}</span>
                    <span className="text-muted-foreground">{code.description}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(code.confidence * 100).toFixed(0)}% confidence)
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">CPT Codes</h4>
              <ul className="space-y-1">
                {codes.cptCodes.map((code: any, idx: number) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span className="font-mono">{code.code}</span>
                    <span className="text-muted-foreground">{code.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">
                Estimated Reimbursement: ${codes.reimbursementEstimate.toFixed(2)}
              </span>
            </div>

            {codes.documentationGaps.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Documentation Gaps
                </h4>
                <ul className="text-sm space-y-1">
                  {codes.documentationGaps.map((gap: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">• {gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
