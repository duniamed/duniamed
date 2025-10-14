import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Mic, FileText, AlertCircle, CheckCircle } from "lucide-react";

export default function VoiceToPrescription() {
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [prescription, setPrescription] = useState<any>(null);
  const { toast } = useToast();

  const handleVoicePrescription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-to-prescription', {
        body: {
          audioTranscript: 'Prescribe Metformin 500mg twice daily for 30 days',
          patientId: 'patient-id',
          specialistId: 'specialist-id'
        }
      });

      if (error) throw error;

      setPrescription(data.prescription);
      toast({
        title: "Prescription Generated",
        description: `Confidence: ${Math.round(data.prescription.confidence * 100)}%`
      });
    } catch (error: any) {
      toast({
        title: "Conversion Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mic className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-bold">Voice-to-Prescription</h2>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={() => {
              setRecording(!recording);
              if (!recording) handleVoicePrescription();
            }}
            disabled={loading}
            className={recording ? "bg-destructive" : ""}
          >
            <Mic className="mr-2 h-5 w-5" />
            {recording ? 'Stop Recording' : 'Start Voice Prescription'}
          </Button>
          {recording && (
            <Badge variant="destructive" className="animate-pulse">Recording...</Badge>
          )}
        </div>
      </Card>

      {prescription && (
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            {prescription.requires_review ? (
              <AlertCircle className="h-6 w-6 text-warning" />
            ) : (
              <CheckCircle className="h-6 w-6 text-success" />
            )}
            <div>
              <h3 className="text-lg font-semibold">Generated Prescription</h3>
              <Badge variant={prescription.requires_review ? "destructive" : "default"}>
                {prescription.requires_review ? 'Requires Review' : 'Ready to Sign'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            {prescription.medications?.map((med: any, idx: number) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{med.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {med.dosage} - {med.frequency}
                      </p>
                      <p className="text-sm text-muted-foreground">Duration: {med.duration}</p>
                      <p className="text-sm mt-2">{med.instructions}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {prescription.warnings?.length > 0 && (
              <div className="p-4 bg-warning/10 border border-warning rounded-lg">
                <p className="font-semibold text-warning mb-2">Warnings:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {prescription.warnings.map((warning: string, idx: number) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1">Approve & Sign</Button>
              <Button variant="outline" className="flex-1">Edit Manually</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
