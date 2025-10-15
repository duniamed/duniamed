import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, FileText, AlertCircle } from 'lucide-react';

export const VoicePrescriptionCapture = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [prescription, setPrescription] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const startRecording = () => {
    setIsRecording(true);
    toast({ title: 'Recording started', description: 'Speak clearly to dictate prescription' });
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('voice-to-prescription', {
        body: {
          audioTranscript: transcript,
          patientId: 'patient-id',
          specialistId: 'specialist-id'
        }
      });

      if (error) throw error;

      setPrescription(data.prescription);
      toast({
        title: 'Prescription extracted',
        description: `${data.extraction.medications.length} medications identified`
      });
    } catch (error: any) {
      toast({
        title: 'Processing failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Prescription Capture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              variant={isRecording ? 'destructive' : 'default'}
            >
              {isRecording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </div>

          {transcript && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{transcript}</p>
            </div>
          )}

          {prescription && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h3 className="font-semibold">Extracted Prescription</h3>
                {prescription.extraction?.requires_review && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Needs Review
                  </Badge>
                )}
              </div>

              {prescription.extraction?.medications.map((med: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{med.name}</span>
                        <Badge>{med.route}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Dosage:</span> {med.dosage}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Frequency:</span> {med.frequency}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span> {med.duration}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Refills:</span> {med.refills}
                        </div>
                      </div>
                      {med.instructions && (
                        <p className="text-sm text-muted-foreground">{med.instructions}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {prescription.extraction?.warnings?.length > 0 && (
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive">Warnings</p>
                      <ul className="list-disc list-inside text-sm text-destructive">
                        {prescription.extraction.warnings.map((warning: string, idx: number) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
